import axios from 'axios'

// EXPO_PUBLIC_API_URL is injected at APK build time for cloud deployments.
// At runtime, setBackendUrl() overrides this when the student scans a QR or enters a code.
let BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:3001'

export function setBackendUrl(host: string, port: number) {
  // Port 443 = HTTPS (cloud/Render), anything else = HTTP (LAN)
  const protocol = port === 443 ? 'https' : 'http'
  const portSuffix = (port === 443 || port === 80) ? '' : `:${port}`
  BASE_URL = `${protocol}://${host}${portSuffix}`
  api.defaults.baseURL = BASE_URL
  console.log('[API] Backend URL set to:', BASE_URL)
}

const api = axios.create({ baseURL: BASE_URL, timeout: 180000 })

export const sessionApi = {
  join: (params: { sessionId?: string; sessionCode?: string; studentName: string }) =>
    api.post('/session/join', params).then(r => r.data),
  get: (sessionId: string) =>
    api.get(`/session/${sessionId}`).then(r => r.data)
}

export const chatApi = {
  send: (sessionId: string, senderId: string, senderName: string, content: string, messageType = 'chat') =>
    api.post('/chat/message', { sessionId, senderId, senderName, role: 'student', content, messageType }).then(r => r.data),
  getMessages: (sessionId: string) =>
    api.get(`/chat/${sessionId}`).then(r => r.data)
}

export const aiApi = {
  ask: (sessionId: string, senderId: string, senderName: string, question: string, sessionTopic?: string, language?: string) =>
    api.post('/ai/ask', { sessionId, senderId, senderName, question, sessionTopic, language }).then(r => r.data),

  command: (params: {
    sessionId?: string
    senderId: string
    senderName: string
    role: string
    input: string
    sessionTopic?: string
    language?: string
  }) => api.post('/ai/command', params).then(r => r.data)
}

export const syncApi = {
  run: (teacherId: string, sessionId?: string) =>
    api.post('/sync/run', { teacherId, sessionId }).catch(() =>
      api.post('/ai/sync', { teacherId, sessionId }).then(r => r.data)
    ),
  status: (actorId: string) =>
    api.get('/sync/status', { params: { actorId } }).catch(() =>
      api.get('/ai/sync/status', { params: { teacherId: actorId } }).then(r => r.data)
    ),
  studentPush: (studentId: string, sessionId: string, items: { type: string; payload: unknown }[], studentName?: string) =>
    api.post('/sync/student-push', { studentId, sessionId, studentName, items }).then(r => r.data)
}

export const quizApi = {
  submit: (quizId: string, sessionId: string, studentId: string, studentName: string, answers: any[]) =>
    api.post('/quiz/submit', { quizId, sessionId, studentId, studentName, answers }).then(r => r.data),
  getActive: (sessionId: string) =>
    api.get(`/quiz/active/${sessionId}`).then(r => r.data)
}

export const reportApi = {
  get: (sessionId: string) =>
    api.get(`/report/${sessionId}`).then(r => r.data)
}

export const audioApi = {
  speak: (text: string, language: string) =>
    api.post('/ai/speak', { text, language }).then(r => r.data),
  voiceAsk: (formData: FormData) =>
    api.post('/ai/voice-ask', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }).then(r => r.data)
}

export default api
