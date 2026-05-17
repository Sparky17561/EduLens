import { Router, Request, Response } from 'express'
import { getDb } from '../db/database'
import { generateId } from '../utils/codeGenerator'
import { broadcastToSession } from '../websocket/wsServer'
import { generateHomework, generateAnalyticsSummary, generateFallbackHomework } from '../services/aiService'

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
      INSERT INTO quiz_questions (id, session_id, quiz_id, question, options_json, correct_answer, topic, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const insertMany = db.transaction((qs: any[]) => {
      qs.forEach((q, idx) => {
        insertQ.run(
          generateId('q'),
          sessionId,
          quizId,
          q.question,
          JSON.stringify(q.options),
          q.correctAnswer,
          q.topic || 'General',
          idx
        )
      })
    })
    insertMany(questions)

    // Broadcast quiz start — send questions (without correct answers) to students
    const safeQuestions = questions.map((q: any, idx: number) => ({
      index: idx,
      question: q.question,
      options: q.options,
      topic: q.topic || 'General'
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

    questions.forEach((q, idx) => {
      const studentAnswer = answers[idx]?.answer || ''
      const isCorrect = studentAnswer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()

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

    // ── Generate homework (use fast fallback initially to not block response) ──
    const initialHomework = generateFallbackHomework(weakTopics, score, total)

    // ── Save student report ───────────────────────────────────────────────────
    const reportId = generateId('report')
    db.prepare(`
      INSERT INTO student_reports
        (id, session_id, student_id, student_name, quiz_id, score, total, percentage,
         weak_topics_json, strong_topics_json, topic_breakdown_json, homework_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      reportId, sessionId, studentId, studentName || 'Student', quizId,
      score, total, percentage,
      JSON.stringify(weakTopics),
      JSON.stringify(strongTopics),
      JSON.stringify(topicBreakdown),
      JSON.stringify(initialHomework)
    )

    // Save homework task record
    const hwId = generateId('hw')
    db.prepare(`
      INSERT INTO homework_tasks (id, student_report_id, student_id, session_id, content_json)
      VALUES (?, ?, ?, ?, ?)
    `).run(hwId, reportId, studentId, sessionId, JSON.stringify(initialHomework))

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

    // ── Send instant HTTP response to student phone! ──────────────────────────
    res.json({
      score,
      total,
      percentage: Math.round(percentage),
      weakTopics,
      strongTopics,
      topicBreakdown,
      homework: initialHomework,
      reportId
    })

    // ── Perform personalization in background (Truly Asynchronous!) ───────────
    generateHomework({
      studentName: studentName || 'Student',
      weakTopics,
      wrongAnswers,
      score,
      total
    }).then(async (aiHomework) => {
      // Save highly personalized homework in DB
      const bgDb = getDb()
      bgDb.prepare(`
        UPDATE student_reports SET homework_json = ? WHERE id = ?
      `).run(JSON.stringify(aiHomework), reportId)

      bgDb.prepare(`
        UPDATE homework_tasks SET content_json = ? WHERE student_report_id = ?
      `).run(JSON.stringify(aiHomework), reportId)

      // Broadcast the personalized homework to student & teacher
      broadcastToSession(sessionId, {
        event: 'homework_ready',
        sessionId,
        payload: { studentId, studentName: studentName || 'Student', homework: aiHomework, reportId }
      })
      console.log(`[AI] Background homework generated successfully for ${studentName}`)
    }).catch(e => {
      console.error('[AI] Background homework generation failed:', e)
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

  db.prepare(`
    UPDATE analytics_summary SET
      avg_score = ?,
      topic_breakdown_json = ?,
      weak_students_json = ?,
      updated_at = datetime('now')
    WHERE session_id = ?
  `).run(Math.round(avgScore), JSON.stringify(topicBreakdown), JSON.stringify(classWeakTopics), sessionId)
}

export default router
