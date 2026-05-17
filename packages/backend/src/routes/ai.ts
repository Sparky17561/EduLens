import { Router, Request, Response } from 'express'
import { getDb } from '../db/database'
import { generateId } from '../utils/codeGenerator'
import { broadcastToSession } from '../websocket/wsServer'
import { askQuestion, generateLessonOutline, aiProvider } from '../services/aiService'

const router = Router()

// GET /ai/status — check provider and availability
router.get('/status', async (_req: Request, res: Response) => {
  const available = await aiProvider.isAvailable()
  res.json({
    provider: aiProvider.providerName(),
    available
  })
})

// POST /ai/ask — student asks a question
router.post('/ask', async (req: Request, res: Response) => {
  try {
    const { sessionId, senderId, senderName, question } = req.body
    if (!question) return res.status(400).json({ error: 'question required' })

    const db = getDb()
    const studentMsgId = generateId('msg')

    // Save and broadcast student's question immediately!
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

    // Now call the slow AI generation
    const answer = await askQuestion(question)

    // Save and broadcast AI response
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

// POST /ai/generate — teacher generates lesson outline
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { sessionId, teacherId, teacherName, topic } = req.body
    if (!topic) return res.status(400).json({ error: 'topic required' })

    const outline = await generateLessonOutline(topic)
    const formatted = formatLessonOutline(outline)

    // Save to chat as generate type
    if (sessionId) {
      const db = getDb()
      db.prepare(`
        INSERT INTO chat_messages (id, session_id, sender_id, sender_name, role, content, message_type)
        VALUES (?, ?, ?, ?, 'teacher', ?, 'generate')
      `).run(generateId('msg'), sessionId, teacherId || 'teacher-default', teacherName || 'Teacher', `/generate ${topic}`)

      const aiMsgId = generateId('msg')
      db.prepare(`
        INSERT INTO chat_messages (id, session_id, sender_id, sender_name, role, content, message_type)
        VALUES (?, ?, 'ai', 'EduLens AI', 'ai', ?, 'generate')
      `).run(aiMsgId, sessionId, formatted)

      broadcastToSession(sessionId, {
        event: 'chat_message',
        sessionId,
        payload: {
          id: aiMsgId,
          sessionId,
          senderId: 'ai',
          senderName: 'EduLens AI',
          role: 'ai',
          content: formatted,
          messageType: 'generate',
          createdAt: new Date().toISOString()
        }
      })
    }

    res.json({ outline, formatted })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

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
