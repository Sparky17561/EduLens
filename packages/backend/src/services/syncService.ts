import { getDb } from '../db/database'
import { generateId } from '../utils/codeGenerator'
import { broadcastToSession } from '../websocket/wsServer'
import { parseSlashCommand, executeChatCommand } from './chatCommandService'
import { uploadBundleToCloud } from './cloudSyncService'

export type SyncEntityType =
  | 'quiz' | 'homework' | 'analytics' | 'chat' | 'report' | 'student_progress'

export interface SyncQueueItem {
  id: string
  entity_type: SyncEntityType
  entity_id: string
  session_id: string | null
  payload_json: string
  status: 'pending' | 'syncing' | 'synced' | 'failed'
  retry_count: number
  last_error: string | null
  created_at: string
  synced_at: string | null
}

const MAX_RETRIES = 5

export function enqueueSync(
  entityType: SyncEntityType,
  entityId: string,
  sessionId: string | null,
  payload: object,
  actorId?: string
): string {
  const db = getDb()
  const id = generateId('syncq')
  db.prepare(`
    INSERT INTO sync_queue (id, actor_id, entity_type, entity_id, session_id, payload_json, status, retry_count)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', 0)
  `).run(id, actorId || 'system', entityType, entityId, sessionId, JSON.stringify(payload))
  return id
}

export function getSyncStatus(actorId?: string) {
  const db = getDb()
  const filter = actorId ? 'WHERE actor_id = ?' : ''
  const params = actorId ? [actorId] : []
  const pendingFilter = actorId
    ? `WHERE actor_id = ? AND status IN ('pending','failed')`
    : `WHERE status IN ('pending','failed')`
  const pending = (db.prepare(
    `SELECT COUNT(*) as c FROM sync_queue ${pendingFilter}`
  ).get(...params) as { c: number }).c

  const items = db.prepare(
    `SELECT * FROM sync_queue ${filter} ORDER BY created_at DESC LIMIT 50`
  ).all(...params) as SyncQueueItem[]

  const logs = db.prepare(
    `SELECT * FROM sync_logs ${actorId ? 'WHERE teacher_id = ?' : ''} ORDER BY synced_at DESC LIMIT 20`
  ).all(...(actorId ? [actorId] : []))

  return { pending, items, logs }
}

/** Process pending queue — reconciles to local snapshot store (offline-first backup) */
export async function processSyncQueue(actorId: string): Promise<{
  synced: number
  failed: number
  recordCount: number
}> {
  const db = getDb()
  const pending = db.prepare(
    `SELECT * FROM sync_queue WHERE actor_id = ? AND status IN ('pending','failed') AND retry_count < ? ORDER BY created_at ASC`
  ).all(actorId, MAX_RETRIES) as SyncQueueItem[]

  let synced = 0
  let failed = 0

  for (const item of pending) {
    db.prepare(`UPDATE sync_queue SET status = 'syncing' WHERE id = ?`).run(item.id)
    try {
      // Reconcile: upsert into sync_snapshots (local cloud-backup simulation)
      const snapshotId = generateId('snap')
      db.prepare(`
        INSERT INTO sync_snapshots (id, actor_id, entity_type, entity_id, session_id, payload_json, synced_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(snapshotId, actorId, item.entity_type, item.entity_id, item.session_id, item.payload_json)

      db.prepare(`
        UPDATE sync_queue SET status = 'synced', synced_at = datetime('now'), last_error = NULL WHERE id = ?
      `).run(item.id)
      synced++
    } catch (err: any) {
      const retries = item.retry_count + 1
      db.prepare(`
        UPDATE sync_queue SET status = 'failed', retry_count = ?, last_error = ? WHERE id = ?
      `).run(retries, err.message, item.id)
      failed++
    }
  }

  const recordCount = synced + (db.prepare(
    `SELECT COUNT(*) as c FROM sync_snapshots WHERE actor_id = ?`
  ).get(actorId) as { c: number }).c

  db.prepare(`
    INSERT INTO sync_logs (id, teacher_id, record_count, status) VALUES (?, ?, ?, ?)
  `).run(generateId('sync'), actorId, recordCount, failed > 0 ? 'partial' : 'success')

  // Push latest session bundles to cloud mirror
  const db2 = getDb()
  const sessions = db2.prepare(`
    SELECT DISTINCT session_id FROM sync_queue WHERE actor_id = ? AND session_id IS NOT NULL
  `).all(actorId) as { session_id: string }[]
  for (const { session_id } of sessions) {
    if (!session_id) continue
    const bundle = buildSessionBundle(session_id)
    if (bundle) await uploadBundleToCloud(actorId, session_id, bundle)
  }

  return { synced, failed, recordCount }
}

function buildSessionBundle(sessionId: string) {
  const db = getDb()
  const session = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(sessionId)
  if (!session) return null
  return {
    session,
    members: db.prepare(`SELECT * FROM session_members WHERE session_id = ?`).all(sessionId),
    reports: db.prepare(`SELECT * FROM student_reports WHERE session_id = ?`).all(sessionId),
    messages: db.prepare(`SELECT * FROM chat_messages WHERE session_id = ?`).all(sessionId),
    analytics: db.prepare(`SELECT * FROM analytics_summary WHERE session_id = ?`).get(sessionId),
    attempts: db.prepare(`SELECT * FROM quiz_attempts WHERE session_id = ?`).all(sessionId)
  }
}

/** Queue all session data for sync */
export function queueSessionForSync(sessionId: string, teacherId: string): number {
  const db = getDb()
  let count = 0

  const reports = db.prepare(`SELECT * FROM student_reports WHERE session_id = ?`).all(sessionId) as any[]
  for (const r of reports) {
    enqueueSync('report', r.id, sessionId, r, teacherId)
    count++
  }

  const messages = db.prepare(`SELECT * FROM chat_messages WHERE session_id = ?`).all(sessionId) as any[]
  if (messages.length) {
    enqueueSync('chat', sessionId, sessionId, { messages }, teacherId)
    count++
  }

  const analytics = db.prepare(`SELECT * FROM analytics_summary WHERE session_id = ?`).get(sessionId) as any
  if (analytics) {
    enqueueSync('analytics', sessionId, sessionId, analytics, teacherId)
    count++
  }

  const attempts = db.prepare(`SELECT * FROM quiz_attempts WHERE session_id = ?`).all(sessionId) as any[]
  for (const a of attempts) {
    enqueueSync('student_progress', a.id, sessionId, a, teacherId)
    count++
  }

  const homework = db.prepare(`SELECT * FROM homework_tasks WHERE session_id = ?`).all(sessionId) as any[]
  for (const h of homework) {
    enqueueSync('homework', h.id, sessionId, h, teacherId)
    count++
  }

  return count
}

/** Replay student offline chat items into live session + AI responses */
export async function replayStudentChatItems(
  sessionId: string,
  studentId: string,
  studentName: string,
  items: Array<{ type?: string; payload?: { content?: string }; content?: string }>
): Promise<number> {
  const db = getDb()
  let replayed = 0
  const session = db.prepare(`SELECT topic FROM sessions WHERE id = ?`).get(sessionId) as { topic?: string } | undefined
  const sessionTopic = session?.topic

  for (const item of items) {
    const content = item.payload?.content || item.content
    if (!content?.trim()) continue

    const msgId = generateId('msg')
    db.prepare(`
      INSERT INTO chat_messages (id, session_id, sender_id, sender_name, role, content, message_type)
      VALUES (?, ?, ?, ?, 'student', ?, 'chat')
    `).run(msgId, sessionId, studentId, studentName, content)

    broadcastToSession(sessionId, {
      event: 'chat_message',
      sessionId,
      payload: {
        id: msgId, sessionId, senderId: studentId, senderName: studentName,
        role: 'student', content, messageType: 'chat',
        createdAt: new Date().toISOString()
      }
    })

    const parsed = parseSlashCommand(content)
    if (parsed) {
      const result = await executeChatCommand(parsed.command, parsed.arg, { sessionTopic })
      const aiMsgId = generateId('msg')
      const metaJson = JSON.stringify({
        citations: result.citations,
        confidence: result.confidence,
        confidenceNote: result.confidenceNote
      })
      try {
        db.prepare(`
          INSERT INTO chat_messages (id, session_id, sender_id, sender_name, role, content, message_type, meta_json)
          VALUES (?, ?, 'ai', 'EduLens AI', 'ai', ?, ?, ?)
        `).run(aiMsgId, sessionId, result.answer, parsed.command, metaJson)
      } catch {
        db.prepare(`
          INSERT INTO chat_messages (id, session_id, sender_id, sender_name, role, content, message_type)
          VALUES (?, ?, 'ai', 'EduLens AI', 'ai', ?, ?)
        `).run(aiMsgId, sessionId, result.answer, parsed.command)
      }
      broadcastToSession(sessionId, {
        event: 'chat_message',
        sessionId,
        payload: {
          id: aiMsgId, sessionId, senderId: 'ai', senderName: 'EduLens AI',
          role: 'ai', content: result.answer, messageType: parsed.command,
          citations: result.citations, confidence: result.confidence,
          createdAt: new Date().toISOString()
        }
      })
    }
    replayed++
  }
  return replayed
}

export function retryFailedSync(actorId: string): number {
  const db = getDb()
  const r = db.prepare(`
    UPDATE sync_queue SET status = 'pending', last_error = NULL
    WHERE actor_id = ? AND status = 'failed' AND retry_count < ?
  `).run(actorId, MAX_RETRIES)
  return r.changes
}
