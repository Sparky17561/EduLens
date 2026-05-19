import axios from 'axios'

// Web deploy: set VITE_API_URL env var pointing to your Render backend.
// Electron: port is discovered via IPC and overrides this via setBaseUrl().
export let baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:3001'

export function setBaseUrl(port: number) {
  // Only override if running inside Electron (no VITE_API_URL set)
  if (!(import.meta as any).env?.VITE_API_URL) {
    baseUrl = `http://127.0.0.1:${port}`
  }
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

  ask: (sessionId: string, senderId: string, senderName: string, question: string, sessionTopic?: string) =>
    api.post('/ai/ask', { sessionId, senderId, senderName, question, sessionTopic }).then((r) => r.data),

  command: (params: {
    sessionId?: string
    senderId: string
    senderName: string
    role: string
    input: string
    sessionTopic?: string
    previousAnswer?: string
  }) => api.post('/ai/command', params).then((r) => r.data),

  generate: (sessionId: string, teacherId: string, teacherName: string, topic: string) =>
    api.post('/ai/generate', { sessionId, teacherId, teacherName, topic }).then((r) => r.data),

  generateTrivia: (sessionId: string, topic: string, difficulty: string) =>
    api.post('/ai/generate-trivia', { sessionId, topic, difficulty }).then((r) => r.data),

  generateTriviaPreview: (topic: string, difficulty: string, questionCount?: number, bloomLevel?: string, questionTypes?: string[]) =>
    api.post('/ai/generate-trivia-preview', { topic, difficulty, questionCount, bloomLevel, questionTypes }, { timeout: 180000 }).then((r) => r.data),

  regenerateQuestion: (topic: string, questionType?: string, bloomLevel?: string) =>
    api.post('/ai/regenerate-question', { topic, questionType, bloomLevel }, { timeout: 120000 }).then((r) => r.data),

  misconceptions: (sessionId: string) =>
    api.get(`/ai/misconceptions/${sessionId}`).then((r) => r.data),

  reteach: (sessionId: string, weakTopics: string[]) =>
    api.post('/ai/reteach', { sessionId, weakTopics }).then((r) => r.data),

  getReteachPlans: (sessionId: string) =>
    api.get(`/ai/reteach/${sessionId}`).then((r) => r.data),

  updateReteachPlan: (id: string, updates: object) =>
    api.patch(`/ai/reteach/${id}`, updates).then((r) => r.data)
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
    api.post('/report/export', { sessionId }).then((r) => r.data),

  exportPdf: (sessionId: string) =>
    api.post('/report/export-pdf', { sessionId }).then((r) => r.data)
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
  sync: (teacherId: string, sessionId?: string) =>
    api.post('/ai/sync', { teacherId, sessionId }).then((r) => r.data),

  status: (teacherId?: string) =>
    api.get('/ai/sync/status', { params: teacherId ? { teacherId } : {} }).then((r) => r.data),

  retry: (teacherId: string) =>
    api.post('/ai/sync/retry', { teacherId }).then((r) => r.data),

  exportBundle: (sessionId: string, teacherId: string) =>
    api.post('/sync/export-bundle', { sessionId, teacherId }).then((r) => r.data),

  importBundle: (bundle: object) =>
    api.post('/sync/import-bundle', { bundle }).then((r) => r.data),

  pullCloud: (teacherId: string, sessionId: string) =>
    api.post('/sync/pull-cloud', { teacherId, sessionId }).then((r) => r.data),

  listCloud: (teacherId: string) =>
    api.get(`/sync/cloud/${teacherId}`).then((r) => r.data)
}

export default api
