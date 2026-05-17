import { useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '../store/appStore'

export function useWebSocket(sessionId: string | null, port: number = 3001) {
  const wsRef = useRef<WebSocket | null>(null)
  const { addMessage, addStudent, removeStudent, updateStudent, setActiveSession, activeSession, addQuizResult } = useAppStore()

  const connect = useCallback(() => {
    if (!sessionId || 
        wsRef.current?.readyState === WebSocket.OPEN || 
        wsRef.current?.readyState === WebSocket.CONNECTING) return

    const ws = new WebSocket(`ws://127.0.0.1:${port}`)
    wsRef.current = ws

    ws.onopen = () => {
      if (ws !== wsRef.current) return
      console.log('[WS] Connected')
      // Register as teacher observer for this session
      ws.send(JSON.stringify({ event: 'teacher_joined', sessionId, payload: { role: 'teacher' } }))
    }

    ws.onmessage = (event) => {
      if (ws !== wsRef.current) return
      try {
        const msg = JSON.parse(event.data) as { event: string; payload: any; sessionId?: string }
        if (msg.sessionId && msg.sessionId !== sessionId) return

        switch (msg.event) {
          case 'student_joined':
            addStudent({
              id: msg.payload.studentId,
              name: msg.payload.studentName,
              joinedAt: new Date().toISOString()
            })
            addMessage({
              id: `sys-${Date.now()}`,
              sessionId: sessionId!,
              senderId: 'system',
              senderName: 'System',
              role: 'ai',
              content: `🟢 ${msg.payload.studentName} joined the session`,
              messageType: 'system',
              createdAt: new Date().toISOString()
            })
            break

          case 'student_left':
            removeStudent(msg.payload.studentId)
            break

          case 'chat_message':
            addMessage({
              id: msg.payload.id,
              sessionId: msg.payload.sessionId,
              senderId: msg.payload.senderId,
              senderName: msg.payload.senderName,
              role: msg.payload.role,
              content: msg.payload.content,
              messageType: msg.payload.messageType || 'chat',
              createdAt: msg.payload.createdAt || new Date().toISOString()
            })
            break

          case 'quiz_submitted':
            updateStudent(msg.payload.studentId, {
              score: msg.payload.score,
              percentage: msg.payload.percentage,
              weakTopics: msg.payload.weakTopics,
              strongTopics: msg.payload.strongTopics,
              topicBreakdown: msg.payload.topicBreakdown
            })
            addQuizResult({
              id: msg.payload.studentId,
              name: msg.payload.studentName,
              joinedAt: '',
              score: msg.payload.score,
              percentage: msg.payload.percentage,
              weakTopics: msg.payload.weakTopics,
              strongTopics: msg.payload.strongTopics,
              topicBreakdown: msg.payload.topicBreakdown
            })
            break

          case 'homework_ready':
            updateStudent(msg.payload.studentId, { homework: msg.payload.homework })
            break

          case 'session_ended':
            setActiveSession(null)
            break

          case 'pong':
            break
        }
      } catch (e) {
        console.error('[WS] Parse error:', e)
      }
    }

    ws.onerror = (err) => {
      if (ws !== wsRef.current) return
      console.error('[WS] Error:', err)
    }
    ws.onclose = () => {
      if (ws !== wsRef.current) return
      console.log('[WS] Disconnected')
      // Reconnect after 2s if session is still active
      if (sessionId) {
        setTimeout(() => connect(), 2000)
      }
    }
  }, [sessionId, port])

  // Ping to keep alive
  useEffect(() => {
    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ event: 'ping', payload: {} }))
      }
    }, 20000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [connect])

  return wsRef
}
