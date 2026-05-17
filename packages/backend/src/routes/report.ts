import { Router, Request, Response } from 'express'
import { getDb } from '../db/database'
import { generateAnalyticsSummary, aiProvider } from '../services/aiService'
import QRCode from 'qrcode'

const router = Router()

// GET /report/:sessionId — full session report (teacher view)
router.get('/:sessionId', async (req: Request, res: Response) => {
  try {
    const db = getDb()
    const { sessionId } = req.params

    const session = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(sessionId) as any
    if (!session) return res.status(404).json({ error: 'Session not found' })

    const members = db.prepare(
      `SELECT * FROM session_members WHERE session_id = ?`
    ).all(sessionId)

    const studentReports = db.prepare(
      `SELECT * FROM student_reports WHERE session_id = ? ORDER BY percentage DESC`
    ).all(sessionId) as any[]

    const analytics = db.prepare(
      `SELECT * FROM analytics_summary WHERE session_id = ?`
    ).get(sessionId) as any

    const homeworkTasks = db.prepare(
      `SELECT * FROM homework_tasks WHERE session_id = ?`
    ).all(sessionId) as any[]

    // Generate AI analytics summary if not already present
    let aiSummary = analytics?.ai_summary
    const isAiAvailable = await aiProvider.isAvailable()
    if (!aiSummary && studentReports.length > 0 && isAiAvailable) {
      try {
        const topicBreakdown = JSON.parse(analytics?.topic_breakdown_json || '{}')
        const weakTopics = JSON.parse(analytics?.weak_students_json || '[]')
        aiSummary = await generateAnalyticsSummary({
          totalStudents: studentReports.length,
          avgScore: analytics?.avg_score || 0,
          weakTopics,
          topicBreakdown
        })
        db.prepare(
          `UPDATE analytics_summary SET ai_summary = ? WHERE session_id = ?`
        ).run(aiSummary, sessionId)
      } catch {
        aiSummary = null
      }
    }

    // Parse JSON fields in reports
    const enrichedReports = studentReports.map((r) => ({
      ...r,
      weakTopics: JSON.parse(r.weak_topics_json || '[]'),
      strongTopics: JSON.parse(r.strong_topics_json || '[]'),
      topicBreakdown: JSON.parse(r.topic_breakdown_json || '{}'),
      homework: JSON.parse(r.homework_json || '{}')
    }))

    res.json({
      session,
      members,
      studentReports: enrichedReports,
      analytics: {
        ...analytics,
        topicBreakdown: JSON.parse(analytics?.topic_breakdown_json || '{}'),
        weakTopics: JSON.parse(analytics?.weak_students_json || '[]'),
        aiSummary
      },
      homeworkTasks: homeworkTasks.map((h) => ({
        ...h,
        content: JSON.parse(h.content_json || '{}')
      }))
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /report/export — generate QR + JSON blob for export
router.post('/export', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' })

    const db = getDb()
    const session = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(sessionId) as any
    if (!session) return res.status(404).json({ error: 'Session not found' })

    const studentReports = db.prepare(
      `SELECT * FROM student_reports WHERE session_id = ?`
    ).all(sessionId) as any[]

    const analytics = db.prepare(
      `SELECT * FROM analytics_summary WHERE session_id = ?`
    ).get(sessionId) as any

    const exportData = {
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      session: {
        id: session.id,
        topic: session.topic,
        sessionCode: session.session_code,
        createdAt: session.created_at,
        endedAt: session.ended_at
      },
      analytics: {
        totalStudents: analytics?.total_students || 0,
        avgScore: analytics?.avg_score || 0,
        topicBreakdown: JSON.parse(analytics?.topic_breakdown_json || '{}'),
        aiSummary: analytics?.ai_summary
      },
      students: studentReports.map((r) => ({
        name: r.student_name,
        score: r.score,
        total: r.total,
        percentage: r.percentage,
        weakTopics: JSON.parse(r.weak_topics_json || '[]'),
        strongTopics: JSON.parse(r.strong_topics_json || '[]'),
        topicBreakdown: JSON.parse(r.topic_breakdown_json || '{}'),
        homework: JSON.parse(r.homework_json || '{}')
      }))
    }

    const jsonBlob = JSON.stringify(exportData)
    const base64 = Buffer.from(jsonBlob).toString('base64')

    // Generate QR of the base64 (for small reports; large ones use JSON download)
    let qrDataUrl: string | null = null
    if (base64.length < 2000) {
      qrDataUrl = await QRCode.toDataURL(`edulens://import/${base64}`, { width: 256 })
    }

    res.json({
      exportData,
      jsonBlob,
      base64,
      qrDataUrl,
      downloadReady: true
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /report/import — import report from QR base64
router.post('/import', (req: Request, res: Response) => {
  try {
    const { base64 } = req.body
    if (!base64) return res.status(400).json({ error: 'base64 required' })
    const json = Buffer.from(base64, 'base64').toString('utf-8')
    const data = JSON.parse(json)
    res.json({ success: true, data })
  } catch (err: any) {
    res.status(400).json({ error: 'Invalid export data' })
  }
})

export default router
