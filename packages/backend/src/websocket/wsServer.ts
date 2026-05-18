import { WebSocketServer, WebSocket } from 'ws'
import { Server } from 'http'

export type WSEventType =
  | 'student_joined'
  | 'teacher_joined'
  | 'student_left'
  | 'chat_message'
  | 'quiz_started'
  | 'quiz_submitted'
  | 'homework_ready'
  | 'session_ended'
  | 'start_video'
  | 'flashcards_ready'
  | 'analytics_updated'
  | 'ping'
  | 'pong'

export interface WSMessage {
  event: WSEventType
  payload: Record<string, unknown>
  sessionId?: string
}

// Map: sessionId → Set of connected WebSocket clients
const sessionClients = new Map<string, Set<WebSocket>>()
// Map: ws → { sessionId, clientId }
const clientMeta = new Map<WebSocket, { sessionId: string; clientId: string }>()

let wss: WebSocketServer

export function initWebSocket(server: Server): WebSocketServer {
  wss = new WebSocketServer({ server })

  wss.on('connection', (ws: WebSocket) => {
    console.log('[WS] New connection')

    ws.on('message', (data: Buffer) => {
      try {
        const msg: WSMessage = JSON.parse(data.toString())

        if (msg.event === 'ping') {
          ws.send(JSON.stringify({ event: 'pong', payload: {} }))
          return
        }

        // Handle session registration
        if (msg.event === 'student_joined' && msg.sessionId) {
          registerClient(ws, msg.sessionId, (msg.payload.studentId as string) || 'unknown')
          broadcastToSession(msg.sessionId, msg, ws)
        }

        if (msg.event === 'teacher_joined' && msg.sessionId) {
          registerClient(ws, msg.sessionId, 'teacher')
          console.log(`[WS] Teacher registered for session: ${msg.sessionId}`)
        }
      } catch (e) {
        console.error('[WS] Parse error:', e)
      }
    })

    ws.on('close', () => {
      const meta = clientMeta.get(ws)
      if (meta) {
        const { sessionId, clientId } = meta
        removeClient(ws, sessionId)
        broadcastToSession(sessionId, {
          event: 'student_left',
          payload: { studentId: clientId },
          sessionId
        })
      }
      clientMeta.delete(ws)
    })

    ws.on('error', (err) => console.error('[WS] Error:', err.message))
  })

  console.log('[WS] WebSocket server initialized')
  return wss
}

export function registerClient(ws: WebSocket, sessionId: string, clientId: string) {
  if (!sessionClients.has(sessionId)) {
    sessionClients.set(sessionId, new Set())
  }
  sessionClients.get(sessionId)!.add(ws)
  clientMeta.set(ws, { sessionId, clientId })
}

function removeClient(ws: WebSocket, sessionId: string) {
  const clients = sessionClients.get(sessionId)
  if (clients) {
    clients.delete(ws)
    if (clients.size === 0) sessionClients.delete(sessionId)
  }
}

export function broadcastToSession(sessionId: string, message: WSMessage, excludeWs?: WebSocket) {
  const clients = sessionClients.get(sessionId)
  if (!clients) return

  const payload = JSON.stringify(message)
  clients.forEach((client) => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(payload)
    }
  })
}

export function broadcastToAll(message: WSMessage) {
  if (!wss) return
  const payload = JSON.stringify(message)
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload)
    }
  })
}

export function getSessionClientCount(sessionId: string): number {
  return sessionClients.get(sessionId)?.size ?? 0
}
