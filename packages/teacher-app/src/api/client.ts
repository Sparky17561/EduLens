import axios from 'axios'

// Port is discovered from Electron IPC or falls back to 3001
export let baseUrl = 'http://127.0.0.1:3001'

export function setBaseUrl(port: number) {
  baseUrl = `http://127.0.0.1:${port}`
}

const api = axios.create({ baseURL: baseUrl, timeout: 180000 })

// Update baseURL dynamically
api.interceptors.request.use((config) => {
  config.baseURL = baseUrl
  return config
})

// ── Session ──────────────────────────────────────────────────────
export const sessionApi = {
  start: (teacherId: string, topic: string, knowledgeBaseId?: string) =>
    api.post('/session/start', { teacherId, topic, knowledgeBaseId }).then((r) => r.data),

  join: (params: { sessionId?: string; sessionCode?: string; studentName: string }) =>
    api.post('/session/join', params).then((r) => r.data),

  end: (sessionId: string, teacherId: string) =>
    api.post('/session/end', { sessionId, teacherId }).then((r) => r.data),

  get: (sessionId: string) =>
    api.get(`/session/${sessionId}`).then((r) => r.data),

  list: (teacherId: string) =>
    api.get('/session', { params: { teacherId } }).then((r) => r.data)
}

// ── Chat ─────────────────────────────────────────────────────────
export const chatApi = {
  send: (sessionId: string, senderId: string, senderName: string, role: string, content: string, messageType?: string) =>
    api.post('/chat/message', { sessionId, senderId, senderName, role, content, messageType }).then((r) => r.data),

  getMessages: (sessionId: string) =>
    api.get(`/chat/${sessionId}`).then((r) => r.data)
}

// ── AI ───────────────────────────────────────────────────────────
export const aiApi = {
  status: () =>
    api.get('/ai/status').then((r) => r.data),

  ask: (sessionId: string, senderId: string, senderName: string, question: string) =>
    api.post('/ai/ask', { sessionId, senderId, senderName, question }).then((r) => r.data),

  generate: (sessionId: string, teacherId: string, teacherName: string, topic: string) =>
    api.post('/ai/generate', { sessionId, teacherId, teacherName, topic }).then((r) => r.data),

  generateTrivia: (sessionId: string, topic: string, difficulty: string) =>
    api.post('/ai/generate-trivia', { sessionId, topic, difficulty }).then((r) => r.data),

  generateTriviaPreview: (topic: string, difficulty: string) =>
    api.post('/ai/generate-trivia-preview', { topic, difficulty }, { timeout: 180000 }).then((r) => r.data)
}

// ── Quiz ─────────────────────────────────────────────────────────
export const quizApi = {
  start: (sessionId: string, teacherId: string, questions: any[]) =>
    api.post('/quiz/start', { sessionId, teacherId, questions }).then((r) => r.data),

  submit: (quizId: string, sessionId: string, studentId: string, studentName: string, answers: any[]) =>
    api.post('/quiz/submit', { quizId, sessionId, studentId, studentName, answers }).then((r) => r.data),

  getResults: (sessionId: string) =>
    api.get(`/quiz/${sessionId}`).then((r) => r.data)
}

// ── Report ───────────────────────────────────────────────────────
export const reportApi = {
  get: (sessionId: string) =>
    api.get(`/report/${sessionId}`).then((r) => r.data),

  export: (sessionId: string) =>
    api.post('/report/export', { sessionId }).then((r) => r.data)
}

// ── Knowledge Bases ───────────────────────────────────────────────
export const knowledgeApi = {
  list: (teacherId: string) =>
    api.get('/ai/knowledge-bases', { params: { teacherId } }).then((r) => r.data),

  upload: (teacherId: string, name: string, file: File) => {
    const form = new FormData()
    form.append('document', file)
    form.append('name', name)
    form.append('teacherId', teacherId)
    return api.post('/ai/knowledge-bases', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
  },

  delete: (id: string) =>
    api.delete(`/ai/knowledge-bases/${id}`).then((r) => r.data)
}

// ── Sync ──────────────────────────────────────────────────────────
export const syncApi = {
  sync: (teacherId: string) =>
    api.post('/ai/sync', { teacherId }).then((r) => r.data)
}

export default api
