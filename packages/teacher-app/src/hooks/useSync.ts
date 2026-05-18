import { useState, useCallback, useEffect } from 'react'
import { syncApi } from '../api/client'
import { useAppStore } from '../store/appStore'

export function useSync() {
  const { teacher, activeSession } = useAppStore()
  const [syncing, setSyncing] = useState(false)
  const [pending, setPending] = useState(0)
  const [logs, setLogs] = useState<any[]>([])
  const [lastSynced, setLastSynced] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refreshStatus = useCallback(async () => {
    if (!teacher) return
    try {
      const status = await syncApi.status(teacher.id)
      setPending(status.pending || 0)
      setLogs(status.logs || [])
    } catch {
      // offline
    }
  }, [teacher?.id])

  useEffect(() => {
    refreshStatus()
    const t = setInterval(refreshStatus, 15000)
    return () => clearInterval(t)
  }, [refreshStatus])

  const runSync = useCallback(async () => {
    if (!teacher || syncing) return
    setSyncing(true)
    setError(null)
    try {
      const result = await syncApi.sync(teacher.id, activeSession?.id)
      setPending(result.pending ?? 0)
      setLastSynced(new Date().toLocaleTimeString())
      await refreshStatus()
    } catch (e: any) {
      setError(e.response?.data?.error || e.message)
    }
    setSyncing(false)
  }, [teacher, activeSession?.id, syncing, refreshStatus])

  const retrySync = useCallback(async () => {
    if (!teacher) return
    await syncApi.retry(teacher.id)
    await runSync()
  }, [teacher, runSync])

  return { syncing, pending, logs, lastSynced, error, runSync, retrySync, refreshStatus }
}
