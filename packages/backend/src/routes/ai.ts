import { Router, Request, Response } from 'express'
import { getDb } from '../db/database'
import { generateId } from '../utils/codeGenerator'
import { broadcastToSession } from '../websocket/wsServer'
import { askQuestion, generateLessonOutline, generateTrivia, generateFlashcards, aiProvider, STRICT_RAG_SYSTEM } from '../services/aiService'
import { processPdfForStorage, retrieveRelevantContext, clearRagContext, getActiveKnowledgeBaseName } from '../services/ragService'
import multer from 'multer'
import fs from 'fs'
import path from 'path'

// Permanent storage for knowledge base PDFs
const knowledgeDir = path.join(process.cwd(), 'data', 'knowledge')
if (!fs.existsSync(knowledgeDir)) fs.mkdirSync(knowledgeDir, { recursive: true })

// Temp upload dir for multer
const uploadDir = path.join(process.cwd(), 'userData', 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
const upload = multer({ dest: uploadDir })

const router = Router()

// GET /ai/status — check provider and availability
router.get('/status', async (_req: Request, res: Response) => {
  const available = await aiProvider.isAvailable()
  res.json({
    provider: aiProvider.providerName(),
    available,
    activeKnowledgeBase: getActiveKnowledgeBaseName() || null
  })
})

// ── Knowledge Bases ──────────────────────────────────────────────────────────

// POST /ai/knowledge-bases — Teacher uploads a named PDF
router.post('/knowledge-bases', upload.single('document'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No document provided' })
    const { name, teacherId } = req.body
    if (!name || !teacherId) return res.status(400).json({ error: 'name and teacherId required' })

    // Move to permanent knowledge dir
    const ext = path.extname(req.file.originalname) || '.pdf'
    const permanentFilename = `${generateId('kb')}${ext}`
    const permanentPath = path.join(knowledgeDir, permanentFilename)
    fs.renameSync(req.file.path, permanentPath)

    // Validate & count chunks
    const chunkCount = await processPdfForStorage(permanentPath)

    // Save to DB
    const db = getDb()
    const kbId = generateId('kb')
    db.prepare(`
      INSERT INTO knowledge_bases (id, teacher_id, name, file_path, chunk_count)
      VALUES (?, ?, ?, ?, ?)
    `).run(kbId, teacherId, name, permanentPath, chunkCount)

    res.json({ success: true, id: kbId, name, chunks: chunkCount })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /ai/knowledge-bases — List all knowledge bases for a teacher
router.get('/knowledge-bases', (req: Request, res: Response) => {
  try {
    const { teacherId } = req.query
    const db = getDb()
    const kbs = db.prepare(
      `SELECT * FROM knowledge_bases ${teacherId ? 'WHERE teacher_id = ?' : ''} ORDER BY created_at DESC`
    ).all(...(teacherId ? [teacherId] : []))
    res.json({ knowledgeBases: kbs })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /ai/knowledge-bases/:id — Delete a knowledge base
router.delete('/knowledge-bases/:id', (req: Request, res: Response) => {
  try {
    const db = getDb()
    const kb = db.prepare('SELECT * FROM knowledge_bases WHERE id = ?').get(req.params.id) as any
    if (!kb) return res.status(404).json({ error: 'Not found' })

    // Delete file if exists
    if (fs.existsSync(kb.file_path)) fs.unlinkSync(kb.file_path)
    db.prepare('DELETE FROM knowledge_bases WHERE id = ?').run(req.params.id)

    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /ai/clear-materials — Clear active session RAG context
router.post('/clear-materials', (_req: Request, res: Response) => {
  clearRagContext()
  res.json({ success: true, message: 'Cleared' })
})

// ── Sync ─────────────────────────────────────────────────────────────────────

// POST /ai/sync — Manual cloud sync (mock for hackathon)
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.body
    if (!teacherId) return res.status(400).json({ error: 'teacherId required' })

    // Simulate network sync delay
    await new Promise(r => setTimeout(r, 1500))

    const db = getDb()
    // Count records to simulate "what's being synced"
    const sessions = (db.prepare(`SELECT COUNT(*) as c FROM sessions WHERE teacher_id = ?`).get(teacherId) as any).c
    const reports = (db.prepare(`SELECT COUNT(*) as c FROM student_reports`).get() as any).c
    const recordCount = sessions + reports

    db.prepare(`INSERT INTO sync_logs (id, teacher_id, record_count, status) VALUES (?, ?, ?, 'success')`)
      .run(generateId('sync'), teacherId, recordCount)

    res.json({ success: true, recordCount, syncedAt: new Date().toISOString() })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ── AI Endpoints ─────────────────────────────────────────────────────────────

// POST /ai/ask — student asks a question (fast, RAG-grounded)
router.post('/ask', async (req: Request, res: Response) => {
  try {
    const { sessionId, senderId, senderName, question } = req.body
    if (!question) return res.status(400).json({ error: 'question required' })

    const db = getDb()
    const studentMsgId = generateId('msg')

    if (sessionId) {
      db.prepare(`
        INSERT INTO chat_messages (id, session_id, sender_id, sender_name, role, content, message_type)
        VALUES (?, ?, ?, ?, 'student', ?, 'ask')
      `).run(studentMsgId, sessionId, senderId || 'unknown', senderName || 'Student', `/ask ${question}`)

      broadcastToSession(sessionId, {
        event: 'chat_message',
        sessionId,
        payload: {
          id: studentMsgId,
          sessionId,
          senderId: senderId || 'unknown',
          senderName: senderName || 'Student',
          role: 'student',
          content: `/ask ${question}`,
          messageType: 'ask',
          createdAt: new Date().toISOString()
        }
      })
    }

    // Augment question with RAG context if a knowledge base is loaded
    const ragContext = retrieveRelevantContext(question)
    let answer: string

    // Use fastAsk if available (Ollama local) for speed — 45s cap, 512 tokens
    const provider = aiProvider as any
    if (provider.fastAsk) {
      let prompt: string
      if (ragContext) {
        prompt = `You are EduLens, a helpful NCERT school tutor. Answer ONLY using the provided context.\n\nContext:\n${ragContext}\n\nStudent Question: ${question}\n\nAnswer (2-4 sentences, simple language):`
      } else {
        prompt = `You are EduLens, a patient NCERT school tutor for Class 6-10 students in India.\n\nStudent Question: ${question}\n\nAnswer (2-4 sentences, simple language, one real-world example if helpful):`
      }
      answer = await provider.fastAsk(prompt, 384)
    } else {
      if (ragContext) {
        const augmented = `Context:\n${ragContext}\n\nStudent Question: ${question}`
        answer = await askQuestion(augmented, STRICT_RAG_SYSTEM, 0.1)
      } else {
        answer = await askQuestion(question)
      }
    }

    // Strip any "Answer:" prefix that small models sometimes prepend
    answer = answer.replace(/^(Answer:|Response:)\s*/i, '').trim()

    if (sessionId) {
      const aiMsgId = generateId('msg')
      db.prepare(`
        INSERT INTO chat_messages (id, session_id, sender_id, sender_name, role, content, message_type)
        VALUES (?, ?, 'ai', 'EduLens AI', 'ai', ?, 'ask')
      `).run(aiMsgId, sessionId, answer)

      broadcastToSession(sessionId, {
        event: 'chat_message',
        sessionId,
        payload: {
          id: aiMsgId,
          sessionId,
          senderId: 'ai',
          senderName: 'EduLens AI',
          role: 'ai',
          content: answer,
          messageType: 'ask',
          triggerStudent: senderName,
          createdAt: new Date().toISOString()
        }
      })
    }

    res.json({ answer })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /ai/generate-trivia-preview — generate trivia for teacher to preview/edit (no broadcast)
router.post('/generate-trivia-preview', async (req: Request, res: Response) => {
  try {
    const { topic, difficulty } = req.body
    if (!topic) return res.status(400).json({ error: 'topic required' })
    const trivia = await generateTrivia(topic, difficulty || 'Medium')
    res.json({ trivia })
  } catch (err: any) {
    console.error('[generate-trivia-preview]', err)
    res.status(500).json({ error: err.message })
  }
})

// POST /ai/generate — teacher generates lesson outline
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { sessionId, teacherId, teacherName, topic } = req.body
    if (!topic) return res.status(400).json({ error: 'topic required' })

    const outline = await generateLessonOutline(topic)
    const formatted = formatLessonOutline(outline)

    if (sessionId) {
      const db = getDb()
      const teacherMsgId = generateId('msg')
      db.prepare(`
        INSERT INTO chat_messages (id, session_id, sender_id, sender_name, role, content, message_type)
        VALUES (?, ?, ?, ?, 'teacher', ?, 'generate')
      `).run(teacherMsgId, sessionId, teacherId || 'teacher-default', teacherName || 'Teacher', `/generate ${topic}`)

      // Broadcast the teacher's original input immediately
      broadcastToSession(sessionId, {
        event: 'chat_message',
        sessionId,
        payload: {
          id: teacherMsgId,
          sessionId,
          senderId: teacherId || 'teacher-default',
          senderName: teacherName || 'Teacher',
          role: 'teacher',
          content: `/generate ${topic}`,
          messageType: 'generate',
          createdAt: new Date().toISOString()
        }
      })

      const aiMsgId = generateId('msg')
      db.prepare(`
        INSERT INTO chat_messages (id, session_id, sender_id, sender_name, role, content, message_type)
        VALUES (?, ?, 'ai', 'EduLens AI', 'ai', ?, 'generate')
      `).run(aiMsgId, sessionId, formatted)

      broadcastToSession(sessionId, {
        event: 'chat_message',
        sessionId,
        payload: {
          id: aiMsgId, sessionId, senderId: 'ai', senderName: 'EduLens AI',
          role: 'ai', content: formatted, messageType: 'generate',
          createdAt: new Date().toISOString()
        }
      })
    }

    res.json({ outline, formatted })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /ai/generate-trivia — generate and broadcast classroom trivia
router.post('/generate-trivia', async (req: Request, res: Response) => {
  try {
    const { sessionId, topic, difficulty } = req.body
    if (!topic) return res.status(400).json({ error: 'topic required' })

    const trivia = await generateTrivia(topic, difficulty || 'Medium')
    if (!trivia || trivia.length === 0) {
      return res.status(500).json({ error: 'Failed to generate trivia questions' })
    }

    let quizId: string | null = null
    if (sessionId) {
      const db = getDb()
      const session = db.prepare(`SELECT * FROM sessions WHERE id = ? AND status = 'active'`).get(sessionId) as any
      if (session) {
        quizId = generateId('quiz')

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
              q.options[q.answerIndex] || '', // Correct answer string
              topic,
              idx
            )
          })
        })
        insertMany(trivia)

        // Broadcast quiz start — send questions (without correct answers) to students
        const safeQuestions = trivia.map((q: any, idx: number) => ({
          index: idx,
          question: q.question,
          options: q.options,
          topic: topic
        }))

        // Save and broadcast as a chat message of type 'quiz'
        const quizCardMsgId = `msg-quiz-${quizId}`
        const quizContent = JSON.stringify({
          quizId,
          questions: safeQuestions,
          totalQuestions: trivia.length
        })

        db.prepare(`
          INSERT INTO chat_messages (id, session_id, sender_id, sender_name, role, content, message_type)
          VALUES (?, ?, 'system', 'EduLens Quiz', 'ai', ?, 'system')
        `).run(quizCardMsgId, sessionId, quizContent)

        // Broadcast standard quiz_started event (for compatibility)
        broadcastToSession(sessionId, {
          event: 'quiz_started',
          sessionId,
          payload: { quizId, questions: safeQuestions, totalQuestions: trivia.length }
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
      }
    }

    res.json({ success: true, quizId, trivia })
  } catch (err: any) {
    console.error('[generate-trivia]', err)
    res.status(500).json({ error: err.message })
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatLessonOutline(outline: any): string {
  return `📚 **${outline.title}**

**Core Concepts:**
${outline.coreConcepts.map((c: string) => `• ${c}`).join('\n')}

**Explanation Steps:**
${outline.explanationSteps.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}

**Common Misconceptions:**
${outline.commonMisconceptions.map((m: string) => `⚠️ ${m}`).join('\n')}

**Quiz Angles:**
${outline.quizAngles.map((q: string) => `• ${q}`).join('\n')}

**Visual Aid:** ${outline.visualAidSuggestion}`
}

export default router
