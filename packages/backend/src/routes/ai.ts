import { Router, Request, Response } from 'express'
import { getDb } from '../db/database'
import { generateId } from '../utils/codeGenerator'
import { broadcastToSession } from '../websocket/wsServer'
import { generateLessonOutline, generateTrivia, aiProvider } from '../services/aiService'
import { generateQuizQuestions, regenerateSingleQuestion, BLOOM_LEVELS } from '../services/quizGenerationService'
import { processPdfForStorage, clearRagContext, getActiveKnowledgeBaseName } from '../services/ragService'
import { isEmbeddingAvailable } from '../services/embeddingService'
import { transcribeAudioBuffer, synthesizeSpeech } from '../services/audioService'
import { parseSlashCommand, executeChatCommand } from '../services/chatCommandService'
import { queueSessionForSync, processSyncQueue, getSyncStatus, retryFailedSync } from '../services/syncService'
import { getSessionMisconceptions } from '../services/misconceptionService'
import { generateReteachFromWeakTopics, getReteachPlans, updateReteachPlan } from '../services/reteachService'
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
const audioUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } })

const router = Router()

// GET /ai/status — check provider and availability
router.get('/status', async (_req: Request, res: Response) => {
  const available = await aiProvider.isAvailable()
  const embeddings = await isEmbeddingAvailable()
  res.json({
    provider: aiProvider.providerName(),
    available,
    activeKnowledgeBase: getActiveKnowledgeBaseName() || null,
    embeddings,
    groqAudio: !!process.env.GROQ_API_KEY,
    cloudSync: !!process.env.SYNC_CLOUD_URL
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

    const db = getDb()

    // Ensure teacher row exists (FK: knowledge_bases.teacher_id → users.id)
    db.prepare(`INSERT OR IGNORE INTO users (id, name, role) VALUES (?, ?, 'teacher')`)
      .run(teacherId, teacherId)

    const kbId = generateId('kb')

    // Insert knowledge_bases row FIRST so rag_chunks FK (kb_id → knowledge_bases.id) doesn't fail
    db.prepare(`
      INSERT INTO knowledge_bases (id, teacher_id, name, file_path, chunk_count, source_count)
      VALUES (?, ?, ?, ?, 0, 1)
    `).run(kbId, teacherId, name, permanentPath)

    // Now process PDF — persistChunks inserts into rag_chunks which requires the KB row above
    const chunkCount = await processPdfForStorage(permanentPath, kbId, name)

    // Update chunk count now that we know the real number
    db.prepare(`UPDATE knowledge_bases SET chunk_count = ? WHERE id = ?`).run(chunkCount, kbId)

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

// POST /ai/sync — Process sync queue (real reconciliation to snapshots)
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const { teacherId, sessionId } = req.body
    if (!teacherId) return res.status(400).json({ error: 'teacherId required' })

    if (sessionId) queueSessionForSync(sessionId, teacherId)
    const result = await processSyncQueue(teacherId)
    const status = getSyncStatus(teacherId)

    res.json({
      success: true,
      ...result,
      pending: status.pending,
      syncedAt: new Date().toISOString()
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/sync/status', (req: Request, res: Response) => {
  try {
    const { teacherId } = req.query
    res.json(getSyncStatus(teacherId as string | undefined))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/sync/retry', (req: Request, res: Response) => {
  try {
    const { teacherId } = req.body
    if (!teacherId) return res.status(400).json({ error: 'teacherId required' })
    const retried = retryFailedSync(teacherId)
    res.json({ success: true, retried })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ── AI Endpoints ─────────────────────────────────────────────────────────────

// POST /ai/command — unified slash command handler
router.post('/command', async (req: Request, res: Response) => {
  try {
    const { sessionId, senderId, senderName, role, input, sessionTopic, previousAnswer } = req.body
    if (!input) return res.status(400).json({ error: 'input required' })

    const parsed = parseSlashCommand(input)
    if (!parsed) return res.status(400).json({ error: 'Invalid slash command' })

    const db = getDb()
    const userMsgId = generateId('msg')
    const msgRole = role === 'teacher' ? 'teacher' : 'student'

    if (sessionId) {
      db.prepare(`
        INSERT INTO chat_messages (id, session_id, sender_id, sender_name, role, content, message_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(userMsgId, sessionId, senderId || 'unknown', senderName || 'User', msgRole, input, parsed.command)

      broadcastToSession(sessionId, {
        event: 'chat_message',
        sessionId,
        payload: {
          id: userMsgId, sessionId, senderId, senderName, role: msgRole,
          content: input, messageType: parsed.command, createdAt: new Date().toISOString()
        }
      })
    }

    if (parsed.command === 'generate') {
      const outline = await generateLessonOutline(parsed.arg)
      const formatted = formatLessonOutline(outline)
      if (sessionId) persistAiMessage(db, sessionId, formatted, 'generate')
      return res.json({ answer: formatted, command: parsed.command, outline })
    }

    const result = await executeChatCommand(parsed.command, parsed.arg, { sessionTopic, previousAnswer })

    if (sessionId) {
      persistAiMessage(db, sessionId, result.answer, parsed.command, {
        citations: result.citations,
        confidence: result.confidence,
        confidenceNote: result.confidenceNote,
        metadata: result.metadata
      })
    }

    res.json({
      answer: result.answer,
      command: parsed.command,
      confidence: result.confidence,
      confidenceNote: result.confidenceNote,
      citations: result.citations,
      metadata: result.metadata
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /ai/ask — backward compatible (delegates to /command)
router.post('/ask', async (req: Request, res: Response) => {
  try {
    const { sessionId, senderId, senderName, question, sessionTopic } = req.body
    if (!question) return res.status(400).json({ error: 'question required' })

    const result = await executeChatCommand('ask', question, { sessionTopic })
    const db = getDb()

    if (sessionId) {
      const studentMsgId = generateId('msg')
      db.prepare(`
        INSERT INTO chat_messages (id, session_id, sender_id, sender_name, role, content, message_type)
        VALUES (?, ?, ?, ?, 'student', ?, 'ask')
      `).run(studentMsgId, sessionId, senderId || 'unknown', senderName || 'Student', `/ask ${question}`)

      broadcastToSession(sessionId, {
        event: 'chat_message',
        sessionId,
        payload: {
          id: studentMsgId, sessionId, senderId, senderName, role: 'student',
          content: `/ask ${question}`, messageType: 'ask', createdAt: new Date().toISOString()
        }
      })
      persistAiMessage(db, sessionId, result.answer, 'ask', {
        citations: result.citations,
        confidence: result.confidence,
        confidenceNote: result.confidenceNote,
        triggerStudent: senderName
      })
    }

    res.json({
      answer: result.answer,
      confidence: result.confidence,
      confidenceNote: result.confidenceNote,
      citations: result.citations
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

function persistAiMessage(
  db: ReturnType<typeof getDb>,
  sessionId: string,
  content: string,
  messageType: string,
  meta?: {
    citations?: unknown[]
    confidence?: string
    confidenceNote?: string
    metadata?: Record<string, unknown>
    triggerStudent?: string
  }
) {
  const aiMsgId = generateId('msg')
  const metaJson = JSON.stringify({
    citations: meta?.citations,
    confidence: meta?.confidence,
    confidenceNote: meta?.confidenceNote,
    metadata: meta?.metadata
  })
  try {
    db.prepare(`
      INSERT INTO chat_messages (id, session_id, sender_id, sender_name, role, content, message_type, meta_json)
      VALUES (?, ?, 'ai', 'EduLens AI', 'ai', ?, ?, ?)
    `).run(aiMsgId, sessionId, content, messageType, metaJson)
  } catch {
    db.prepare(`
      INSERT INTO chat_messages (id, session_id, sender_id, sender_name, role, content, message_type)
      VALUES (?, ?, 'ai', 'EduLens AI', 'ai', ?, ?)
    `).run(aiMsgId, sessionId, content, messageType)
  }

  broadcastToSession(sessionId, {
    event: 'chat_message',
    sessionId,
    payload: {
      id: aiMsgId, sessionId, senderId: 'ai', senderName: 'EduLens AI',
      role: 'ai', content, messageType,
      citations: meta?.citations,
      confidence: meta?.confidence,
      confidenceNote: meta?.confidenceNote,
      metadata: meta?.metadata,
      triggerStudent: meta?.triggerStudent,
      createdAt: new Date().toISOString()
    }
  })
}

// GET /ai/misconceptions/:sessionId
router.get('/misconceptions/:sessionId', (req: Request, res: Response) => {
  res.json({ misconceptions: getSessionMisconceptions(req.params.sessionId) })
})

// POST /ai/reteach — generate reteach plans from weak topics
router.post('/reteach', async (req: Request, res: Response) => {
  try {
    const { sessionId, weakTopics } = req.body
    if (!sessionId || !weakTopics?.length) return res.status(400).json({ error: 'sessionId and weakTopics required' })
    const plans = await generateReteachFromWeakTopics(sessionId, weakTopics)
    res.json({ plans })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/reteach/:sessionId', (req: Request, res: Response) => {
  res.json({ plans: getReteachPlans(req.params.sessionId) })
})

router.patch('/reteach/:id', (req: Request, res: Response) => {
  try {
    const plan = updateReteachPlan(req.params.id, req.body)
    if (!plan) return res.status(404).json({ error: 'Not found' })
    res.json({ plan })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /ai/generate-trivia-preview — generate trivia for teacher to preview/edit (no broadcast)
router.post('/generate-trivia-preview', async (req: Request, res: Response) => {
  try {
    const { topic, difficulty, bloomLevel, questionCount, questionTypes } = req.body
    if (!topic) return res.status(400).json({ error: 'topic required' })
    const trivia = await generateQuizQuestions({
      topic,
      difficulty: difficulty || 'Medium',
      bloomLevel: bloomLevel || 'Understand',
      count: questionCount || 5,
      questionTypes
    })
    res.json({ trivia, bloomLevels: BLOOM_LEVELS })
  } catch (err: any) {
    console.error('[generate-trivia-preview]', err)
    res.status(500).json({ error: err.message })
  }
})

router.post('/regenerate-question', async (req: Request, res: Response) => {
  try {
    const { topic, questionType, bloomLevel, existingQuestion } = req.body
    if (!topic) return res.status(400).json({ error: 'topic required' })
    const question = await regenerateSingleQuestion({ topic, questionType, bloomLevel, existingQuestion })
    res.json({ question })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/transcribe', audioUpload.single('audio'), async (req: Request, res: Response) => {
  try {
    const language = (req.body.language as string) || 'en-US'

    if (req.file?.buffer) {
      const { text, source } = await transcribeAudioBuffer(
        req.file.buffer,
        req.file.mimetype || 'audio/webm',
        language
      )
      if (text) {
        return res.json({ text, source, language })
      }
      return res.status(503).json({
        error: 'Speech recognition unavailable. Set GROQ_API_KEY for Whisper, or use textHint.',
        language
      })
    }

    const { textHint } = req.body
    if (textHint) {
      return res.json({ text: String(textHint).trim(), source: 'client', language })
    }

    res.status(400).json({
      error: 'Send audio file (multipart field "audio") or textHint in body',
      language
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /ai/speak — neural TTS (Edge) returns base64 MP3
router.post('/speak', async (req: Request, res: Response) => {
  try {
    const { text, language = 'en-US' } = req.body
    if (!text) return res.status(400).json({ error: 'text required' })
    const audio = await synthesizeSpeech(String(text), language)
    if (!audio) {
      return res.status(503).json({ error: 'TTS unavailable on server; use device narrate', fallback: 'client' })
    }
    res.json(audio)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /ai/voice-ask — audio in → transcribe → /ask → optional TTS out
router.post('/voice-ask', audioUpload.single('audio'), async (req: Request, res: Response) => {
  try {
    const language = (req.body.language as string) || 'hi-IN'
    const sessionTopic = req.body.sessionTopic as string | undefined
    let question = (req.body.question as string) || ''

    if (req.file?.buffer) {
      const stt = await transcribeAudioBuffer(req.file.buffer, req.file.mimetype || 'audio/webm', language)
      question = stt.text
    } else if (req.body.audioBase64) {
      const buf = Buffer.from(String(req.body.audioBase64), 'base64')
      const stt = await transcribeAudioBuffer(buf, req.body.audioMime || 'audio/m4a', language)
      question = stt.text
    }
    if (!question.trim()) {
      return res.status(400).json({ error: 'No speech detected. Try again or type your question.' })
    }

    const result = await executeChatCommand('ask', question, { sessionTopic })
    const tts = await synthesizeSpeech(result.answer.replace(/⚠️|ℹ️/g, ''), language)

    res.json({
      question,
      ...result,
      audio: tts
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/bloom-levels', (_req: Request, res: Response) => {
  res.json({ levels: BLOOM_LEVELS })
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
