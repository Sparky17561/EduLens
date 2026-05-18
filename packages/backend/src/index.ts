import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { initDatabase } from './db/database'
import { initWebSocket } from './websocket/wsServer'
import sessionRoutes from './routes/session'
import chatRoutes from './routes/chat'
import aiRoutes from './routes/ai'
import quizRoutes from './routes/quiz'
import reportRoutes from './routes/report'
import syncRoutes from './routes/sync'

export interface ServerOptions {
  port?: number
  dbPath?: string
}

export function startServer(options: ServerOptions = {}) {
  const port = options.port || parseInt(process.env.PORT || '3001')

  // Initialize SQLite
  initDatabase(options.dbPath)

  const app = express()

  app.use(cors({ origin: '*' }))
  app.use(express.json({ limit: '10mb' }))

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'EduLens Backend', timestamp: new Date().toISOString() })
  })

  // API routes
  app.use('/session', sessionRoutes)
  app.use('/chat', chatRoutes)
  app.use('/ai', aiRoutes)
  app.use('/quiz', quizRoutes)
  app.use('/report', reportRoutes)
  app.use('/sync', syncRoutes)

  // Error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Server Error]', err)
    res.status(500).json({ error: err.message })
  })

  // Create HTTP server and attach WebSocket
  const httpServer = createServer(app)
  initWebSocket(httpServer)

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`[Server] EduLens backend running on http://0.0.0.0:${port}`)
    console.log(`[Server] LAN accessible — share your IP with students`)
  })

  return { app, httpServer, port }
}

// Run standalone if called directly
if (require.main === module) {
  startServer()
}
