import { useEffect, useRef } from 'react'
import { useSessionStore } from '../store/sessionStore'

export function useStudentWebSocket() {
  const { session, student, addMessage, setActiveQuiz, setSessionEnded, setQuizResult, setFlashcards, setPendingQuiz, setHomeworkGenerating, completedQuizIds } = useSessionStore()
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!session || !student) {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      return
    }

    let active = true

    function connect() {
      if (!active) return

      if (wsRef.current) {
        try { wsRef.current.close() } catch {}
      }

      console.log(`[WS] Connecting to student socket: ws://${session.host}:${session.port}`)
      const ws = new WebSocket(`ws://${session.host}:${session.port}`)
      wsRef.current = ws

      ws.onopen = () => {
        if (!active || ws !== wsRef.current) return
        console.log('[WS] Connected to teacher server')

        ws.send(JSON.stringify({
          event: 'student_joined',
          sessionId: session.id,
          payload: { studentId: student.id, studentName: student.name, sessionId: session.id }
        }))
      }

      ws.onmessage = (e) => {
        if (!active || ws !== wsRef.current) return
        try {
          const msg = JSON.parse(e.data)
          if (msg.sessionId && msg.sessionId !== session.id) return

          switch (msg.event) {
            case 'chat_message':
              addMessage({
                id: msg.payload.id,
                senderId: msg.payload.senderId,
                senderName: msg.payload.senderName,
                role: msg.payload.role,
                content: msg.payload.content,
                messageType: msg.payload.messageType || 'chat',
                createdAt: msg.payload.createdAt || new Date().toISOString(),
                citations: msg.payload.citations,
                confidence: msg.payload.confidence,
                confidenceNote: msg.payload.confidenceNote
              })
              break

            case 'quiz_started': {
              const quizId = msg.payload.quizId
              const store = useSessionStore.getState()
              // Skip if student already completed this quiz (handles rejoin)
              if (store.completedQuizIds.includes(quizId)) {
                console.log('[WS] quiz_started ignored — already completed:', quizId)
                break
              }
              if (store.quizResult) {
                console.log('[WS] quiz_started ignored — already has result this session')
                break
              }
              setActiveQuiz({ quizId, questions: msg.payload.questions })
              setPendingQuiz(true)
              break
            }

            case 'session_ended':
              setSessionEnded(true)
              break

            case 'homework_ready': {
              const latestStore = useSessionStore.getState()
              if (msg.payload.studentId === student.id && latestStore.quizResult) {
                setQuizResult({
                  ...latestStore.quizResult,
                  homework: msg.payload.homework
                })
                setHomeworkGenerating(false)
              }
              break
            }

            case 'flashcards_ready':
              if (msg.payload.flashcards?.length) {
                setFlashcards(msg.payload.flashcards as any)
              }
              break
          }
        } catch (err) {
          console.error('[WS] Message parse error:', err)
        }
      }

      ws.onerror = (err) => console.log('[WS] Socket error:', err)

      ws.onclose = () => {
        if (!active) return
        console.log('[WS] Socket disconnected, reconnecting in 3s...')
        setTimeout(() => {
          if (active) connect()
        }, 3000)
      }
    }

    connect()

    return () => {
      active = false
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [session?.id, student?.id])
}
