import { Router, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import { getDb } from '../db/database'
import { generateId } from '../utils/codeGenerator'
import {
  getSyncStatus,
  processSyncQueue,
  queueSessionForSync,
  retryFailedSync,
  enqueueSync,
  replayStudentChatItems
} from '../services/syncService'
import { uploadBundleToCloud, downloadBundleFromCloud, listLocalCloudBundles } from '../services/cloudSyncService'
import { restoreBundle } from '../services/bundleRestoreService'

const router = Router()

// GET /sync/status — queue status and logs
router.get('/status', (req: Request, res: Response) => {
  try {
    const { actorId } = req.query
    const status = getSyncStatus(actorId as string | undefined)
    res.json(status)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /sync/run — process pending queue
router.post('/run', async (req: Request, res: Response) => {
  try {
    const { teacherId, sessionId } = req.body
    if (!teacherId) return res.status(400).json({ error: 'teacherId required' })

    if (sessionId) queueSessionForSync(sessionId, teacherId)
    const result = await processSyncQueue(teacherId)
    res.json({ success: true, ...result, syncedAt: new Date().toISOString() })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /sync/retry — retry failed items
router.post('/retry', (req: Request, res: Response) => {
  try {
    const { teacherId } = req.body
    if (!teacherId) return res.status(400).json({ error: 'teacherId required' })
    const retried = retryFailedSync(teacherId)
    res.json({ success: true, retried })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /sync/queue — enqueue session data without processing
router.post('/queue', (req: Request, res: Response) => {
  try {
    const { teacherId, sessionId } = req.body
    if (!teacherId || !sessionId) return res.status(400).json({ error: 'teacherId and sessionId required' })
    const queued = queueSessionForSync(sessionId, teacherId)
    res.json({ success: true, queued })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /sync/student-push — student pushes offline actions to queue
router.post('/student-push', async (req: Request, res: Response) => {
  try {
    const { studentId, sessionId, studentName, items } = req.body
    if (!studentId || !sessionId) return res.status(400).json({ error: 'studentId and sessionId required' })
    const list = Array.isArray(items) ? items : []
    const replayed = await replayStudentChatItems(
      sessionId,
      studentId,
      studentName || 'Student',
      list
    )
    list.forEach((item: any, i: number) => {
      enqueueSync('chat', `${sessionId}-${studentId}-${i}`, sessionId, item, studentId)
    })
    await processSyncQueue(studentId)
    const status = getSyncStatus(studentId)
    res.json({ success: true, queued: list.length, replayed, pending: status.pending })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /sync/export-bundle — export full session backup file for cloud transfer
router.post('/export-bundle', async (req: Request, res: Response) => {
  try {
    const { sessionId, teacherId } = req.body
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' })
    const db = getDb()
    const bundle = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      session: db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(sessionId),
      members: db.prepare(`SELECT * FROM session_members WHERE session_id = ?`).all(sessionId),
      reports: db.prepare(`SELECT * FROM student_reports WHERE session_id = ?`).all(sessionId),
      messages: db.prepare(`SELECT * FROM chat_messages WHERE session_id = ?`).all(sessionId),
      analytics: db.prepare(`SELECT * FROM analytics_summary WHERE session_id = ?`).get(sessionId),
      attempts: db.prepare(`SELECT * FROM quiz_attempts WHERE session_id = ?`).all(sessionId)
    }
    const dir = path.join(process.cwd(), 'data', 'exports')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const filename = `edulens-${sessionId}-${Date.now()}.json`
    const filePath = path.join(dir, filename)
    fs.writeFileSync(filePath, JSON.stringify(bundle, null, 2))
    if (teacherId) enqueueSync('report', sessionId, sessionId, { filePath, filename }, teacherId)
    const cloud = teacherId
      ? await uploadBundleToCloud(teacherId, sessionId, bundle)
      : { ok: false, remote: false }
    res.json({
      success: true,
      filename,
      filePath,
      recordCount: bundle.reports.length,
      cloud
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /sync/import-bundle — restore from exported JSON
router.post('/import-bundle', (req: Request, res: Response) => {
  try {
    const { bundle } = req.body
    if (!bundle?.session?.id) return res.status(400).json({ error: 'Invalid bundle' })
    const result = restoreBundle(bundle)
    res.json({
      success: true,
      message: 'Session restored to local database',
      sessionId: result.sessionId,
      restored: result.restored
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /sync/cloud/:teacherId — list cloud mirror files
router.get('/cloud/:teacherId', (req: Request, res: Response) => {
  try {
    res.json({ files: listLocalCloudBundles(req.params.teacherId) })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /sync/pull-cloud — download bundle from cloud into DB
router.post('/pull-cloud', async (req: Request, res: Response) => {
  try {
    const { teacherId, sessionId } = req.body
    if (!teacherId || !sessionId) return res.status(400).json({ error: 'teacherId and sessionId required' })
    const bundle = await downloadBundleFromCloud(teacherId, sessionId)
    if (!bundle) return res.status(404).json({ error: 'No cloud bundle found' })
    const result = restoreBundle(bundle as any)
    res.json({ success: true, sessionId: result.sessionId, restored: result.restored })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
