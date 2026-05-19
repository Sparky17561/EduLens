import { Router, Request, Response } from 'express'
import { getDb } from '../db/database'
import { generateId, generateSessionCode, getLocalIP } from '../utils/codeGenerator'
import { broadcastToSession } from '../websocket/wsServer'
import { generateFlashcards } from '../services/aiService'
import { loadKnowledgeBase, clearRagContext } from '../services/ragService'
import QRCode from 'qrcode'

const router = Router()

// POST /session/start
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { teacherId, topic, knowledgeBaseId } = req.body
    if (!teacherId) return res.status(400).json({ error: 'teacherId required' })

    const db = getDb()
    const teacher = db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(teacherId, 'teacher')
    if (!teacher) return res.status(403).json({ error: 'Invalid teacher' })

    // End any existing active session for this teacher
    db.prepare(`UPDATE sessions SET status='ended', ended_at=datetime('now') WHERE teacher_id=? AND status='active'`).run(teacherId)

    const sessionId = generateId('sess')
    const sessionCode = generateSessionCode()

    // PUBLIC_URL env var overrides LAN IP detection (used when backend is on Render/cloud)
    // e.g. PUBLIC_URL=edulens-backend.onrender.com
    const publicDomain = process.env.PUBLIC_URL
    const hostIp = publicDomain || getLocalIP()
    const port = publicDomain ? 443 : parseInt(process.env.PORT || '3001')

    // QR encodes a deep-link with all join info
    const joinUrl = `edulens://join/${sessionId}?code=${sessionCode}&host=${hostIp}&port=${port}`
    const qrDataUrl = await QRCode.toDataURL(joinUrl, { width: 300, margin: 1 })

    db.prepare(`
      INSERT INTO sessions (id, teacher_id, topic, status, session_code, qr_data, host_ip, port)
      VALUES (?, ?, ?, 'active', ?, ?, ?, ?)
    `).run(sessionId, teacherId, topic || 'General', sessionCode, qrDataUrl, hostIp, port)

    // Init analytics row
    db.prepare(`
      INSERT OR IGNORE INTO analytics_summary (id, session_id) VALUES (?, ?)
    `).run(generateId('analytics'), sessionId)

    // Load knowledge base into RAG if provided
    let kbName = null
    if (knowledgeBaseId) {
      const kb = db.prepare('SELECT * FROM knowledge_bases WHERE id = ?').get(knowledgeBaseId) as any
      if (kb) {
        clearRagContext()
        await loadKnowledgeBase(kb.file_path, kb.name, kb.id)
        kbName = kb.name
      }
    } else {
      clearRagContext() // clear previous session context
    }

    // Generate flashcards in the background — save to DB + broadcast
    generateFlashcards(topic || 'General').then(flashcards => {
      try {
        getDb().prepare(`UPDATE sessions SET flashcards_json = ? WHERE id = ?`)
          .run(JSON.stringify(flashcards), sessionId)
      } catch {}
      broadcastToSession(sessionId, {
        event: 'flashcards_ready',
        sessionId,
        payload: { topic: topic || 'General', flashcards }
      })
    }).catch(err => console.warn('[Session] Flashcard generation failed:', err))

    res.json({
      sessionId,
      sessionCode,
      qrDataUrl,
      hostIp,
      port,
      joinUrl,
      topic: topic || 'General',
      knowledgeBaseName: kbName
    })
  } catch (err: any) {
    console.error('[session/start]', err)
    res.status(500).json({ error: err.message })
  }
})

// POST /session/join
router.post('/join', async (req: Request, res: Response) => {
  try {
    const { sessionId, sessionCode, studentName } = req.body
    if (!studentName) return res.status(400).json({ error: 'studentName required' })
    if (!sessionId && !sessionCode) return res.status(400).json({ error: 'sessionId or sessionCode required' })

    const db = getDb()
    let session: any

    if (sessionId) {
      session = db.prepare(`SELECT * FROM sessions WHERE id = ? AND status = 'active'`).get(sessionId)
    } else {
      session = db.prepare(`SELECT * FROM sessions WHERE session_code = ? AND status = 'active'`).get(sessionCode?.toUpperCase())
    }

    if (!session) return res.status(404).json({ error: 'Session not found or has ended' })

    // Create or reuse student user
    let student: any = db.prepare(`SELECT * FROM users WHERE name = ? AND role = 'student'`).get(studentName)
    if (!student) {
      const studentId = generateId('stu')
      db.prepare(`INSERT INTO users (id, name, role) VALUES (?, ?, 'student')`).run(studentId, studentName)
      student = { id: studentId, name: studentName }
    }

    // Add to session members
    const existingMember = db.prepare(
      `SELECT * FROM session_members WHERE session_id = ? AND student_id = ? AND is_active = 1`
    ).get(session.id, student.id)

    if (!existingMember) {
      const memberId = generateId('mem')
      db.prepare(`
        INSERT INTO session_members (id, session_id, student_id, student_name, is_active)
        VALUES (?, ?, ?, ?, 1)
      `).run(memberId, session.id, student.id, studentName)
    }

    // Broadcast join event
    broadcastToSession(session.id, {
      event: 'student_joined',
      sessionId: session.id,
      payload: { studentId: student.id, studentName, sessionId: session.id }
    })

    // Update analytics count
    const memberCount = (db.prepare(`SELECT COUNT(*) as c FROM session_members WHERE session_id = ? AND is_active = 1`).get(session.id) as any).c
    db.prepare(`UPDATE analytics_summary SET total_students = ?, updated_at = datetime('now') WHERE session_id = ?`).run(memberCount, session.id)

    res.json({
      sessionId: session.id,
      sessionCode: session.session_code,
      topic: session.topic,
      studentId: student.id,
      studentName,
      hostIp: session.host_ip,
      port: session.port
    })
  } catch (err: any) {
    console.error('[session/join]', err)
    res.status(500).json({ error: err.message })
  }
})

// POST /session/end
router.post('/end', (req: Request, res: Response) => {
  try {
    const { sessionId, teacherId } = req.body
    if (!sessionId || !teacherId) return res.status(400).json({ error: 'sessionId and teacherId required' })

    const db = getDb()
    const session = db.prepare(`SELECT * FROM sessions WHERE id = ? AND teacher_id = ?`).get(sessionId, teacherId)
    if (!session) return res.status(404).json({ error: 'Session not found' })

    db.prepare(`UPDATE sessions SET status='ended', ended_at=datetime('now') WHERE id=?`).run(sessionId)
    db.prepare(`UPDATE session_members SET is_active=0, left_at=datetime('now') WHERE session_id=? AND is_active=1`).run(sessionId)

    broadcastToSession(sessionId, {
      event: 'session_ended',
      sessionId,
      payload: { sessionId, message: 'Session has ended. Thank you!' }
    })

    res.json({ success: true, sessionId })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /session/:id
router.get('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb()
    const session = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(req.params.id) as any
    if (!session) return res.status(404).json({ error: 'Session not found' })

    const members = db.prepare(
      `SELECT sm.*, u.name FROM session_members sm JOIN users u ON sm.student_id = u.id WHERE sm.session_id = ? AND sm.is_active = 1`
    ).all(req.params.id)

    const flashcards = session.flashcards_json ? JSON.parse(session.flashcards_json) : []

    res.json({ session, members, flashcards })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /session (list all sessions for teacher)
router.get('/', (req: Request, res: Response) => {
  try {
    const { teacherId } = req.query
    const db = getDb()
    const sessions = db.prepare(
      `SELECT s.*, COUNT(sm.id) as student_count FROM sessions s LEFT JOIN session_members sm ON s.id = sm.session_id ${teacherId ? 'WHERE s.teacher_id = ?' : ''} GROUP BY s.id ORDER BY s.created_at DESC`
    ).all(...(teacherId ? [teacherId] : []))
    res.json({ sessions })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
