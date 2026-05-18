import fs from 'fs'
import path from 'path'

const CLOUD_DIR = path.join(process.cwd(), 'data', 'cloud')

export interface CloudUploadResult {
  ok: boolean
  remote: boolean
  url?: string
  localPath?: string
  error?: string
}

/** Upload session bundle to remote URL and/or local cloud mirror */
export async function uploadBundleToCloud(
  teacherId: string,
  sessionId: string,
  bundle: object
): Promise<CloudUploadResult> {
  const body = JSON.stringify({
    version: '2.0',
    teacherId,
    sessionId,
    exportedAt: new Date().toISOString(),
    bundle
  })

  const localDir = path.join(CLOUD_DIR, teacherId)
  if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true })
  const localPath = path.join(localDir, `${sessionId}-${Date.now()}.json`)
  fs.writeFileSync(localPath, body)

  const remoteUrl = process.env.SYNC_CLOUD_URL
  if (!remoteUrl) {
    return { ok: true, remote: false, localPath }
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (process.env.SYNC_CLOUD_API_KEY) {
      headers.Authorization = `Bearer ${process.env.SYNC_CLOUD_API_KEY}`
    }
    const endpoint = remoteUrl.replace(/\/$/, '') + '/edulens/bundles'
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ teacherId, sessionId, data: bundle })
    })
    if (!res.ok) {
      const errText = await res.text()
      return { ok: true, remote: false, localPath, error: `Remote sync failed: ${errText}` }
    }
    const data: any = await res.json().catch(() => ({}))
    return {
      ok: true,
      remote: true,
      localPath,
      url: data.url || endpoint
    }
  } catch (e: any) {
    return { ok: true, remote: false, localPath, error: e.message }
  }
}

export async function downloadBundleFromCloud(
  teacherId: string,
  sessionId: string
): Promise<object | null> {
  const remoteUrl = process.env.SYNC_CLOUD_URL
  if (remoteUrl) {
    try {
      const headers: Record<string, string> = {}
      if (process.env.SYNC_CLOUD_API_KEY) {
        headers.Authorization = `Bearer ${process.env.SYNC_CLOUD_API_KEY}`
      }
      const endpoint = `${remoteUrl.replace(/\/$/, '')}/edulens/bundles/${teacherId}/${sessionId}`
      const res = await fetch(endpoint, { headers })
      if (res.ok) {
        const data: any = await res.json()
        return data.bundle || data
      }
    } catch {
      /* fall through to local */
    }
  }

  const localDir = path.join(CLOUD_DIR, teacherId)
  if (!fs.existsSync(localDir)) return null
  const files = fs.readdirSync(localDir)
    .filter(f => f.startsWith(sessionId))
    .sort()
    .reverse()
  if (!files.length) return null
  const raw = fs.readFileSync(path.join(localDir, files[0]), 'utf8')
  const parsed = JSON.parse(raw)
  return parsed.bundle || parsed
}

export function listLocalCloudBundles(teacherId: string): string[] {
  const localDir = path.join(CLOUD_DIR, teacherId)
  if (!fs.existsSync(localDir)) return []
  return fs.readdirSync(localDir).filter(f => f.endsWith('.json'))
}
