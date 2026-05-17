import { Router, Request, Response } from 'express'
import { getDb } from '../db/database'
import { generateId } from '../utils/codeGenerator'
import { broadcastToSession } from '../websocket/wsServer'

const router = Router()

// POST /chat/message
router.post('/message', (req: Request, res: Response) => {
  try {
    const { sessionId, senderId, senderName, role, content, messageType } = req.body
    if (!sessionId || !senderId || !content) {
      return res.status(400).json({ error: 'sessionId, senderId, content required' })
    }

    const db = getDb()
    const session = db.prepare(`SELECT id FROM sessions WHERE id = ? AND status = 'active'`).get(sessionId)
    if (!session) return res.status(404).json({ error: 'Active session not found' })

    const messageId = generateId('msg')
    db.prepare(`
      INSERT INTO chat_messages (id, session_id, sender_id, sender_name, role, content, message_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(messageId, sessionId, senderId, senderName || 'Unknown', role || 'student', content, messageType || 'chat')

    const message = {
      id: messageId,
      sessionId,
      senderId,
      senderName: senderName || 'Unknown',
      role: role || 'student',
      content,
      messageType: messageType || 'chat',
      createdAt: new Date().toISOString()
    }

    broadcastToSession(sessionId, {
      event: 'chat_message',
      sessionId,
      payload: message
    })

    res.json({ message })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /chat/:sessionId — get all messages for a session
router.get('/:sessionId', (req: Request, res: Response) => {
  try {
    const db = getDb()
    const messages = db.prepare(
      `SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC`
    ).all(req.params.sessionId)
    res.json({ messages })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
