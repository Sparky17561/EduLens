import { useState, useCallback, useEffect } from 'react'
import { reportApi } from '../api/client'

export function useReport(sessionId: string | null, refreshKey = 0) {
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    setError(null)
    try {
      const data = await reportApi.get(sessionId)
      setReport(data)
    } catch (e: any) {
      setError(e.response?.data?.error || e.message)
    }
    setLoading(false)
  }, [sessionId])

  useEffect(() => {
    refresh()
  }, [sessionId, refreshKey, refresh])

  return { report, loading, error, refresh }
}
