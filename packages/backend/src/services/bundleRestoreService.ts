import { getDb } from '../db/database'
import { generateId } from '../utils/codeGenerator'

export interface EduLensBundle {
  version?: string
  session?: any
  members?: any[]
  reports?: any[]
  messages?: any[]
  analytics?: any
  attempts?: any[]
  homework_tasks?: any[]
  misconceptions?: any[]
  reteach_plans?: any[]
}

export function restoreBundle(bundle: EduLensBundle): { sessionId: string; restored: Record<string, number> } {
  const db = getDb()
  const session = bundle.session
  if (!session?.id) throw new Error('Invalid bundle: missing session')

  const counts: Record<string, number> = {}

  const run = db.transaction(() => {
    const existing = db.prepare(`SELECT id FROM sessions WHERE id = ?`).get(session.id)
    if (existing) {
      db.prepare(`DELETE FROM chat_messages WHERE session_id = ?`).run(session.id)
      db.prepare(`DELETE FROM student_reports WHERE session_id = ?`).run(session.id)
      db.prepare(`DELETE FROM quiz_attempts WHERE session_id = ?`).run(session.id)
      db.prepare(`DELETE FROM session_members WHERE session_id = ?`).run(session.id)
      db.prepare(`DELETE FROM analytics_summary WHERE session_id = ?`).run(session.id)
      db.prepare(`DELETE FROM homework_tasks WHERE session_id = ?`).run(session.id)
      db.prepare(`DELETE FROM misconceptions WHERE session_id = ?`).run(session.id)
      db.prepare(`DELETE FROM reteach_plans WHERE session_id = ?`).run(session.id)
      db.prepare(`DELETE FROM sessions WHERE id = ?`).run(session.id)
    }

    db.prepare(`
      INSERT INTO sessions (id, teacher_id, topic, status, session_code, qr_data, host_ip, port, created_at, ended_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      session.id,
      session.teacher_id,
      session.topic || 'Restored',
      session.status || 'ended',
      session.session_code || session.id.slice(-6),
      session.qr_data || null,
      session.host_ip || null,
      session.port || 3001,
      session.created_at || new Date().toISOString(),
      session.ended_at || null
    )

    counts.sessions = 1

    for (const m of bundle.members || []) {
      try {
        db.prepare(`
          INSERT OR REPLACE INTO session_members (id, session_id, student_id, student_name, joined_at, left_at, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          m.id || generateId('mem'),
          session.id,
          m.student_id,
          m.student_name,
          m.joined_at || new Date().toISOString(),
          m.left_at || null,
          m.is_active ?? 1
        )
        counts.members = (counts.members || 0) + 1
      } catch { /* skip bad row */ }
    }

    for (const r of bundle.reports || []) {
      try {
        db.prepare(`
          INSERT OR REPLACE INTO student_reports
          (id, session_id, student_id, student_name, quiz_id, score, total, percentage,
           weak_topics_json, strong_topics_json, topic_breakdown_json, homework_json, homework_status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          r.id || generateId('report'),
          session.id,
          r.student_id,
          r.student_name,
          r.quiz_id,
          r.score,
          r.total,
          r.percentage,
          r.weak_topics_json || '[]',
          r.strong_topics_json || '[]',
          r.topic_breakdown_json || '{}',
          r.homework_json || '{}',
          r.homework_status || 'ready',
          r.created_at || new Date().toISOString()
        )
        counts.reports = (counts.reports || 0) + 1
      } catch { /* skip */ }
    }

    for (const msg of bundle.messages || []) {
      try {
        db.prepare(`
          INSERT OR REPLACE INTO chat_messages (id, session_id, sender_id, sender_name, role, content, message_type, created_at, meta_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          msg.id || generateId('msg'),
          session.id,
          msg.sender_id,
          msg.sender_name,
          msg.role,
          msg.content,
          msg.message_type || 'chat',
          msg.created_at || new Date().toISOString(),
          msg.meta_json || '{}'
        )
        counts.messages = (counts.messages || 0) + 1
      } catch {
        try {
          db.prepare(`
            INSERT OR REPLACE INTO chat_messages (id, session_id, sender_id, sender_name, role, content, message_type, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            msg.id || generateId('msg'),
            session.id,
            msg.sender_id,
            msg.sender_name,
            msg.role,
            msg.content,
            msg.message_type || 'chat',
            msg.created_at || new Date().toISOString()
          )
          counts.messages = (counts.messages || 0) + 1
        } catch { /* skip */ }
      }
    }

    if (bundle.analytics) {
      const a = bundle.analytics
      try {
        db.prepare(`
          INSERT OR REPLACE INTO analytics_summary
          (session_id, total_students, avg_score, topic_breakdown_json, weak_students_json, strong_topics_json, ai_summary, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          session.id,
          a.total_students || 0,
          a.avg_score || 0,
          a.topic_breakdown_json || '{}',
          a.weak_students_json || '[]',
          a.strong_topics_json || '[]',
          a.ai_summary || null,
          a.updated_at || new Date().toISOString()
        )
        counts.analytics = 1
      } catch { /* skip */ }
    }

    for (const att of bundle.attempts || []) {
      try {
        db.prepare(`
          INSERT OR REPLACE INTO quiz_attempts
          (id, quiz_id, session_id, student_id, student_name, answers_json, score, total, percentage, submitted_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          att.id || generateId('attempt'),
          att.quiz_id,
          session.id,
          att.student_id,
          att.student_name,
          att.answers_json || '[]',
          att.score,
          att.total,
          att.percentage,
          att.submitted_at || new Date().toISOString()
        )
        counts.attempts = (counts.attempts || 0) + 1
      } catch { /* skip */ }
    }
  })

  run()
  return { sessionId: session.id, restored: counts }
}
