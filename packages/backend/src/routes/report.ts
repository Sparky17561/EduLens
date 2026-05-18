import { Router, Request, Response } from 'express'
import { getDb } from '../db/database'
import { generateAnalyticsSummary, aiProvider } from '../services/aiService'
import { getSessionMisconceptions } from '../services/misconceptionService'
import { getReteachPlans } from '../services/reteachService'
import QRCode from 'qrcode'

const router = Router()

function buildActionableReport(session: any, studentReports: any[], analytics: any) {
  const topicBreakdown = JSON.parse(analytics?.topic_breakdown_json || '{}')
  const weakTopics = JSON.parse(analytics?.weak_students_json || '[]')

  const ranked = [...studentReports].sort((a, b) => b.percentage - a.percentage)
  const struggling = ranked.filter(r => r.percentage < 60)
  const strongTopics = Object.entries(topicBreakdown)
    .filter(([, pct]) => (pct as number) >= 70)
    .map(([t]) => t)
  const weakAreas = Object.entries(topicBreakdown)
    .filter(([, pct]) => (pct as number) < 60)
    .sort(([, a], [, b]) => (a as number) - (b as number))
    .map(([t]) => t)

  const homeworkCompleted = studentReports.filter(
    r => JSON.parse(r.homework_json || '{}')?.followUpQuestions?.length > 0
  ).length

  const misconceptions = getSessionMisconceptions(session.id)
  const reteachTopics = [...new Set(misconceptions.map(m => m.topic))].slice(0, 5)

  return {
    classSummary: {
      topic: session.topic,
      totalStudents: analytics?.total_students || studentReports.length,
      avgScore: Math.round(analytics?.avg_score || 0),
      attendanceRate: studentReports.length > 0 ? 100 : 0,
      homeworkCompletionRate: studentReports.length
        ? Math.round((homeworkCompleted / studentReports.length) * 100)
        : 0,
      engagementLevel:
        studentReports.length >= 5 ? 'high' : studentReports.length >= 2 ? 'medium' : 'low'
    },
    weakAreas: weakAreas.length ? weakAreas : weakTopics,
    strongTopics,
    studentRanking: ranked.map((r, i) => ({
      rank: i + 1,
      name: r.student_name,
      score: r.score,
      total: r.total,
      percentage: Math.round(r.percentage),
      weakTopics: JSON.parse(r.weak_topics_json || '[]'),
      strongTopics: JSON.parse(r.strong_topics_json || '[]')
    })),
    strugglingStudents: struggling.map(s => ({
      name: s.student_name,
      percentage: Math.round(s.percentage),
      weakTopics: JSON.parse(s.weak_topics_json || '[]')
    })),
    misconceptions: misconceptions.slice(0, 10),
    recommendedReteachTopics: reteachTopics.length ? reteachTopics : weakAreas.slice(0, 3),
    homeworkStats: {
      assigned: studentReports.length,
      generated: homeworkCompleted,
      pending: studentReports.length - homeworkCompleted
    },
    recommendations: [
      weakAreas.length ? `Reteach: ${weakAreas.slice(0, 2).join(', ')}` : 'Continue to next topic',
      struggling.length ? `Support ${struggling.length} struggling student(s) with targeted practice` : 'Class performing well overall',
      'Review misconception patterns in Analytics tab'
    ],
    confidenceLevel: (analytics?.avg_score || 0) >= 70 ? 'high' : (analytics?.avg_score || 0) >= 50 ? 'medium' : 'needs_attention'
  }
}

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

    let aiSummary = analytics?.ai_summary
    const isAiAvailable = await aiProvider.isAvailable()
    if (!aiSummary && studentReports.length > 0 && isAiAvailable) {
      try {
        const topicBreakdownRaw = JSON.parse(analytics?.topic_breakdown_json || '{}')
        const weakTopics = JSON.parse(analytics?.weak_students_json || '[]')
        const topicBreakdown = Object.fromEntries(
          Object.entries(topicBreakdownRaw).map(([topic, avg]) => [
            topic,
            { avg: avg as number, count: studentReports.length }
          ])
        )
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

    const enrichedReports = studentReports.map((r) => ({
      ...r,
      weakTopics: JSON.parse(r.weak_topics_json || '[]'),
      strongTopics: JSON.parse(r.strong_topics_json || '[]'),
      topicBreakdown: JSON.parse(r.topic_breakdown_json || '{}'),
      homework: JSON.parse(r.homework_json || '{}'),
      homeworkStatus: r.homework_status || 'ready'
    }))

    const insights = buildActionableReport(session, studentReports, analytics)

    res.json({
      session,
      members,
      studentReports: enrichedReports,
      analytics: {
        ...analytics,
        topicBreakdown: JSON.parse(analytics?.topic_breakdown_json || '{}'),
        weakTopics: JSON.parse(analytics?.weak_students_json || '[]'),
        strongTopics: JSON.parse(analytics?.strong_topics_json || '[]'),
        aiSummary
      },
      insights,
      reteachPlans: getReteachPlans(sessionId),
      homeworkTasks: db.prepare(`SELECT * FROM homework_tasks WHERE session_id = ?`).all(sessionId).map((h: any) => ({
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
    const { sessionId, format } = req.body
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

    const insights = buildActionableReport(session, studentReports, analytics)

    const exportData = {
      exportVersion: '2.0',
      exportedAt: new Date().toISOString(),
      session: {
        id: session.id,
        topic: session.topic,
        sessionCode: session.session_code,
        createdAt: session.created_at,
        endedAt: session.ended_at
      },
      insights,
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
        homework: JSON.parse(r.homework_json || '{}'),
        homeworkStatus: r.homework_status
      }))
    }

    const jsonBlob = JSON.stringify(exportData, null, 2)
    const base64 = Buffer.from(jsonBlob).toString('base64')

    let qrDataUrl: string | null = null
    if (base64.length < 2000) {
      qrDataUrl = await QRCode.toDataURL(`edulens://import/${base64}`, { width: 256 })
    }

    res.json({
      exportData,
      jsonBlob,
      base64,
      qrDataUrl,
      downloadReady: true,
      format: format || 'json',
      pdfHint: 'Use browser Print to PDF on the exported report view'
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

function buildReportHtml(exportData: any, insights: any): string {
  const students = exportData.students || []
  const rows = students.map((s: any, i: number) => `
    <tr>
      <td>${i + 1}</td>
      <td>${s.name}</td>
      <td>${s.score}/${s.total} (${Math.round(s.percentage)}%)</td>
      <td>${(s.weakTopics || []).join(', ') || '—'}</td>
    </tr>`).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>EduLens Report</title>
<style>
body{font-family:system-ui,sans-serif;padding:40px;color:#1a1a2e;max-width:900px;margin:0 auto}
h1{color:#6366f1}h2{margin-top:28px;border-bottom:1px solid #e2e8f0;padding-bottom:8px}
.stat{display:inline-block;margin:12px 24px 12px 0;padding:16px 20px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0}
table{width:100%;border-collapse:collapse;margin-top:12px}th,td{padding:10px;text-align:left;border-bottom:1px solid #e2e8f0}
th{background:#f1f5f9}@media print{body{padding:20px}}
</style></head><body>
<h1>EduLens Class Report</h1>
<p><strong>Topic:</strong> ${exportData.session?.topic} · <strong>Code:</strong> ${exportData.session?.sessionCode}</p>
<p><strong>Exported:</strong> ${exportData.exportedAt}</p>
<div>
  <div class="stat"><strong>${insights?.classSummary?.totalStudents || 0}</strong><br>Students</div>
  <div class="stat"><strong>${insights?.classSummary?.avgScore || 0}%</strong><br>Class Avg</div>
  <div class="stat"><strong>${insights?.classSummary?.homeworkCompletionRate || 0}%</strong><br>Homework Done</div>
</div>
<h2>Class Summary</h2>
<p>${exportData.analytics?.aiSummary || insights?.recommendations?.join(' ') || 'No AI summary yet.'}</p>
<h2>Weak Areas</h2>
<p>${(insights?.weakAreas || []).join(', ') || 'None identified'}</p>
<h2>Student Ranking</h2>
<table><thead><tr><th>#</th><th>Student</th><th>Score</th><th>Weak Topics</th></tr></thead><tbody>${rows}</tbody></table>
<h2>Recommendations</h2>
<ul>${(insights?.recommendations || []).map((r: string) => `<li>${r}</li>`).join('')}</ul>
</body></html>`
}

// POST /report/export-pdf — returns printable HTML (Save as PDF in browser)
router.post('/export-pdf', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' })

    const db = getDb()
    const session = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(sessionId) as any
    if (!session) return res.status(404).json({ error: 'Session not found' })

    const studentReports = db.prepare(`SELECT * FROM student_reports WHERE session_id = ?`).all(sessionId) as any[]
    const analytics = db.prepare(`SELECT * FROM analytics_summary WHERE session_id = ?`).get(sessionId) as any
    const insights = buildActionableReport(session, studentReports, analytics)

    const exportData = {
      exportVersion: '2.0',
      exportedAt: new Date().toISOString(),
      session: { id: session.id, topic: session.topic, sessionCode: session.session_code },
      analytics: { aiSummary: analytics?.ai_summary, avgScore: analytics?.avg_score },
      students: studentReports.map(r => ({
        name: r.student_name,
        score: r.score,
        total: r.total,
        percentage: r.percentage,
        weakTopics: JSON.parse(r.weak_topics_json || '[]')
      }))
    }

    const html = buildReportHtml(exportData, insights)
    res.json({ html, filename: `edulens-report-${session.session_code}.html`, downloadReady: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router


