import { useEffect, useRef } from 'react'
import { useSessionStore } from '../store/sessionStore'
import { useProfileStore } from '../store/profileStore'

export function useStudentWebSocket() {
  const { session, student, addMessage, setActiveQuiz, setSessionEnded, setQuizResult, setFlashcards, setPendingQuiz, setHomeworkGenerating, completedQuizIds, addReteachPlan } = useSessionStore()
  const joinTimeRef = useRef(Date.now())
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

      const wsProtocol = session.port === 443 ? 'wss' : 'ws'
      const wsPort = (session.port === 443 || session.port === 80) ? '' : `:${session.port}`
      const wsUrl = `${wsProtocol}://${session.host}${wsPort}`
      console.log(`[WS] Connecting to student socket: ${wsUrl}`)
      const ws = new WebSocket(wsUrl)
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

            case 'session_ended': {
              setSessionEnded(true)
              const state = useSessionStore.getState()
              const profileState = useProfileStore.getState()
              if (state.session && state.student) {
                const qr = state.quizResult
                profileState.addSessionRecord({
                  id: `${state.session.id}-${Date.now()}`,
                  sessionId: state.session.id,
                  code: state.session.code,
                  topic: state.session.topic,
                  date: new Date().toISOString(),
                  durationSeconds: Math.round((Date.now() - joinTimeRef.current) / 1000),
                  quizScore: qr?.score,
                  quizTotal: qr?.total,
                  quizPercentage: qr ? Math.round(qr.percentage) : undefined,
                  weakTopics: qr?.weakTopics,
                  strongTopics: qr?.strongTopics,
                  topicBreakdown: qr?.topicBreakdown,
                  homework: qr?.homework,
                  reportId: qr?.reportId,
                })
              }
              break
            }

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

            case 'reteach_assigned':
              if (msg.payload?.id) {
                addReteachPlan(msg.payload)
                addMessage({
                  id: `reteach-${msg.payload.id}`,
                  senderId: 'system',
                  senderName: 'Teacher',
                  role: 'ai',
                  content: `📚 Your teacher assigned a reteach lesson: **${msg.payload.topic}**\n${msg.payload.lessonSummary}`,
                  messageType: 'reteach',
                  createdAt: new Date().toISOString(),
                })
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

    joinTimeRef.current = Date.now()
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
