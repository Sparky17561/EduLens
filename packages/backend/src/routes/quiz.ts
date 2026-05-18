import { Router, Request, Response } from 'express'
import { getDb } from '../db/database'
import { generateId } from '../utils/codeGenerator'
import { broadcastToSession } from '../websocket/wsServer'
import { generateHomework, generateFallbackHomework } from '../services/aiService'
import { analyzeWrongAnswers } from '../services/misconceptionService'
import { generateReteachPlan } from '../services/reteachService'
import { aiProvider } from '../services/aiService'
import { enqueueSync } from '../services/syncService'
import { scoreAnswer, parseQuestionRow } from '../utils/quizScoring'

const router = Router()

// POST /quiz/start — teacher launches a quiz
router.post('/start', (req: Request, res: Response) => {
  try {
    const { sessionId, teacherId, questions } = req.body
    // questions: Array<{ question, options: string[], correctAnswer, topic }>
    if (!sessionId || !questions?.length) {
      return res.status(400).json({ error: 'sessionId and questions required' })
    }

    const db = getDb()
    const session = db.prepare(`SELECT * FROM sessions WHERE id = ? AND status = 'active'`).get(sessionId) as any
    if (!session) return res.status(404).json({ error: 'Active session not found' })

    const quizId = generateId('quiz')

    const insertQ = db.prepare(`
      INSERT INTO quiz_questions (id, session_id, quiz_id, question, options_json, correct_answer, topic, order_index, question_type, bloom_level, extra_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const insertMany = db.transaction((qs: any[]) => {
      qs.forEach((q, idx) => {
        const qType = q.questionType || q.type || 'mcq'
        const extra = { matchPairs: q.matchPairs, blanks: q.blanks }
        insertQ.run(
          generateId('q'),
          sessionId,
          quizId,
          q.question,
          JSON.stringify(q.options || []),
          q.correctAnswer,
          q.topic || 'General',
          idx,
          qType,
          q.bloomLevel || 'Understand',
          JSON.stringify(extra)
        )
      })
    })
    insertMany(questions)

    const safeQuestions = questions.map((q: any, idx: number) => ({
      index: idx,
      question: q.question,
      options: q.options || [],
      topic: q.topic || 'General',
      questionType: q.questionType || q.type || 'mcq',
      matchPairs: q.matchPairs,
      blanks: q.blanks
    }))

    // Save and broadcast as a chat message of type 'quiz'
    const quizCardMsgId = `msg-quiz-${quizId}`
    const quizContent = JSON.stringify({
      quizId,
      questions: safeQuestions,
      totalQuestions: questions.length
    })

    db.prepare(`
      INSERT INTO chat_messages (id, session_id, sender_id, sender_name, role, content, message_type)
      VALUES (?, ?, 'system', 'EduLens Quiz', 'ai', ?, 'system')
    `).run(quizCardMsgId, sessionId, quizContent)

    // Broadcast standard quiz_started event (for compatibility)
    broadcastToSession(sessionId, {
      event: 'quiz_started',
      sessionId,
      payload: { quizId, questions: safeQuestions, totalQuestions: questions.length }
    })

    // Broadcast chat_message of type 'quiz' so it lands in their chat lists
    broadcastToSession(sessionId, {
      event: 'chat_message',
      sessionId,
      payload: {
        id: quizCardMsgId,
        sessionId,
        senderId: 'system',
        senderName: 'EduLens Quiz',
        role: 'ai',
        content: quizContent,
        messageType: 'quiz',
        createdAt: new Date().toISOString()
      }
    })

    res.json({ quizId, questionCount: questions.length })
  } catch (err: any) {
    console.error('[quiz/start]', err)
    res.status(500).json({ error: err.message })
  }
})

// POST /quiz/submit — student submits answers
// This triggers: scoring → weak-area analysis → homework generation → report save
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const { quizId, sessionId, studentId, studentName, answers } = req.body
    // answers: Array<{ questionIndex: number, answer: string }>
    if (!quizId || !sessionId || !studentId || !answers) {
      return res.status(400).json({ error: 'quizId, sessionId, studentId, answers required' })
    }

    const db = getDb()

    // Get quiz questions WITH correct answers (server-side scoring)
    const questions = db.prepare(
      `SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY order_index ASC`
    ).all(quizId) as any[]

    if (!questions.length) return res.status(404).json({ error: 'Quiz not found' })

    // ── Score the attempt ─────────────────────────────────────────────────────
    let score = 0
    const topicScores: Record<string, { correct: number; total: number }> = {}
    const wrongAnswers: Array<{ question: string; studentAnswer: string; correctAnswer: string; topic: string }> = []

    questions.forEach((rawQ, idx) => {
      const q = parseQuestionRow(rawQ)
      const studentAnswer = answers[idx]?.answer || ''
      const isCorrect = scoreAnswer(q.questionType, studentAnswer, q.correct_answer, q.extra)

      if (!topicScores[q.topic]) topicScores[q.topic] = { correct: 0, total: 0 }
      topicScores[q.topic].total++

      if (isCorrect) {
        score++
        topicScores[q.topic].correct++
      } else {
        wrongAnswers.push({
          question: q.question,
          studentAnswer,
          correctAnswer: q.correct_answer,
          topic: q.topic
        })
      }
    })

    const total = questions.length
    const percentage = total > 0 ? (score / total) * 100 : 0

    // ── Classify topics ──────────────────────────────────────────────────────
    const weakTopics: string[] = []
    const strongTopics: string[] = []
    const topicBreakdown: Record<string, number> = {}

    Object.entries(topicScores).forEach(([topic, stats]) => {
      const pct = (stats.correct / stats.total) * 100
      topicBreakdown[topic] = Math.round(pct)
      if (pct < 60) weakTopics.push(topic)
      else strongTopics.push(topic)
    })

    // ── Save quiz attempt ─────────────────────────────────────────────────────
    const attemptId = generateId('attempt')
    db.prepare(`
      INSERT INTO quiz_attempts (id, quiz_id, session_id, student_id, student_name, answers_json, score, total, percentage)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(attemptId, quizId, sessionId, studentId, studentName || 'Student', JSON.stringify(answers), score, total, percentage)

    // ── AI-only homework (retry once; fallback only if AI offline) ────────────
    const reportId = generateId('report')
    let finalHomework: any = null
    let homeworkStatus: 'ready' | 'fallback' = 'ready'

    const aiAvailable = await aiProvider.isAvailable()
    if (!aiAvailable) {
      finalHomework = generateFallbackHomework(weakTopics, score, total)
      homeworkStatus = 'fallback'
    } else {
      let lastErr: Error | null = null
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          finalHomework = await Promise.race([
            generateHomework({
              studentName: studentName || 'Student',
              weakTopics,
              wrongAnswers,
              score,
              total
            }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Homework generation timeout')), 120_000)
            )
          ])
          homeworkStatus = 'ready'
          lastErr = null
          break
        } catch (e: any) {
          lastErr = e
          console.warn(`[quiz/submit] Homework attempt ${attempt + 1} failed:`, e.message)
        }
      }
      if (!finalHomework) {
        console.warn('[quiz/submit] AI homework failed after retries:', lastErr)
        finalHomework = generateFallbackHomework(weakTopics, score, total)
        homeworkStatus = 'fallback'
      }
    }

    db.prepare(`
      INSERT INTO student_reports
        (id, session_id, student_id, student_name, quiz_id, score, total, percentage,
         weak_topics_json, strong_topics_json, topic_breakdown_json, homework_json, homework_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      reportId, sessionId, studentId, studentName || 'Student', quizId,
      score, total, percentage,
      JSON.stringify(weakTopics),
      JSON.stringify(strongTopics),
      JSON.stringify(topicBreakdown),
      JSON.stringify(finalHomework),
      homeworkStatus
    )

    const hwId = generateId('hw')
    db.prepare(`
      INSERT INTO homework_tasks (id, student_report_id, student_id, session_id, content_json)
      VALUES (?, ?, ?, ?, ?)
    `).run(hwId, reportId, studentId, sessionId, JSON.stringify(finalHomework))

    // ── Update analytics summary ──────────────────────────────────────────────
    updateAnalytics(db, sessionId)

    // ── Broadcast results to teacher dashboard immediately! ───────────────────
    broadcastToSession(sessionId, {
      event: 'quiz_submitted',
      sessionId,
      payload: {
        studentId,
        studentName: studentName || 'Student',
        score,
        total,
        percentage: Math.round(percentage),
        weakTopics,
        strongTopics,
        topicBreakdown
      }
    })

    // Misconception analysis (background-friendly, non-blocking)
    analyzeWrongAnswers({
      sessionId,
      studentId,
      studentName: studentName || 'Student',
      wrongAnswers
    }).then(() => {
      broadcastToSession(sessionId, { event: 'analytics_updated', sessionId, payload: { sessionId } })
    }).catch(e => console.warn('[misconception]', e))

    if (weakTopics.length) {
      generateReteachPlan(sessionId, weakTopics[0]).catch(e => console.warn('[reteach]', e))
    }

  enqueueSync('student_progress', attemptId, sessionId, {
      studentId, score, total, percentage, weakTopics
    }, studentId)

    broadcastToSession(sessionId, {
      event: 'homework_ready',
      sessionId,
      payload: {
        studentId,
        studentName: studentName || 'Student',
        homework: finalHomework,
        homeworkStatus,
        reportId
      }
    })

    broadcastToSession(sessionId, {
      event: 'analytics_updated',
      sessionId,
      payload: { sessionId }
    })

    res.json({
      score,
      total,
      percentage: Math.round(percentage),
      weakTopics,
      strongTopics,
      topicBreakdown,
      homework: finalHomework,
      homeworkStatus,
      reportId
    })
  } catch (err: any) {
    console.error('[quiz/submit]', err)
    res.status(500).json({ error: err.message })
  }
})

// GET /quiz/:sessionId — get all quiz results for a session
router.get('/:sessionId', (req: Request, res: Response) => {
  try {
    const db = getDb()
    const attempts = db.prepare(
      `SELECT * FROM quiz_attempts WHERE session_id = ? ORDER BY submitted_at DESC`
    ).all(req.params.sessionId)
    const questions = db.prepare(
      `SELECT * FROM quiz_questions WHERE session_id = ? ORDER BY order_index ASC`
    ).all(req.params.sessionId)
    res.json({ attempts, questions })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Helper: recompute analytics after each submission
function updateAnalytics(db: any, sessionId: string) {
  const attempts = db.prepare(
    `SELECT * FROM quiz_attempts WHERE session_id = ?`
  ).all(sessionId) as any[]

  if (!attempts.length) return

  const avgScore = attempts.reduce((sum: number, a: any) => sum + a.percentage, 0) / attempts.length

  // Aggregate topic breakdown
  const reports = db.prepare(
    `SELECT topic_breakdown_json, weak_topics_json FROM student_reports WHERE session_id = ?`
  ).all(sessionId) as any[]

  const topicTotals: Record<string, { sum: number; count: number }> = {}
  const weakTopicFreq: Record<string, number> = {}

  reports.forEach((r: any) => {
    const bd = JSON.parse(r.topic_breakdown_json || '{}')
    Object.entries(bd).forEach(([topic, pct]) => {
      if (!topicTotals[topic]) topicTotals[topic] = { sum: 0, count: 0 }
      topicTotals[topic].sum += pct as number
      topicTotals[topic].count++
    })
    const weak = JSON.parse(r.weak_topics_json || '[]')
    weak.forEach((t: string) => {
      weakTopicFreq[t] = (weakTopicFreq[t] || 0) + 1
    })
  })

  const topicBreakdown: Record<string, number> = {}
  Object.entries(topicTotals).forEach(([topic, stats]) => {
    topicBreakdown[topic] = Math.round(stats.sum / stats.count)
  })

  const classWeakTopics = Object.entries(weakTopicFreq)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([topic]) => topic)

  const strongTopics = Object.entries(topicBreakdown)
    .filter(([, pct]) => pct >= 70)
    .map(([topic]) => topic)

  db.prepare(`
    UPDATE analytics_summary SET
      avg_score = ?,
      topic_breakdown_json = ?,
      weak_students_json = ?,
      strong_topics_json = ?,
      updated_at = datetime('now')
    WHERE session_id = ?
  `).run(
    Math.round(avgScore),
    JSON.stringify(topicBreakdown),
    JSON.stringify(classWeakTopics),
    JSON.stringify(strongTopics),
    sessionId
  )
}

// GET /quiz/active/:sessionId — returns the latest quiz for a session (for late-joining students)
router.get('/active/:sessionId', (req: Request, res: Response) => {
  try {
    const db = getDb()
    const questions = db.prepare(
      `SELECT * FROM quiz_questions WHERE session_id = ? ORDER BY quiz_id DESC, order_index ASC`
    ).all(req.params.sessionId) as any[]

    if (!questions.length) return res.json({ quiz: null })

    const quizId = questions[0].quiz_id
    const quizQuestions = questions
      .filter((q: any) => q.quiz_id === quizId)
      .map((q: any) => {
        const extra = q.extra_json ? JSON.parse(q.extra_json) : {}
        return {
          index: q.order_index,
          question: q.question,
          options: q.options_json ? JSON.parse(q.options_json) : [],
          topic: q.topic,
          questionType: q.question_type || 'mcq',
          matchPairs: extra.matchPairs,
          blanks: extra.blanks
        }
      })

    res.json({ quiz: { quizId, questions: quizQuestions } })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
