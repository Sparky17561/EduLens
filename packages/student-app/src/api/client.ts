import axios from 'axios'

let BASE_URL = 'http://192.168.1.100:3001'  // Default — overridden by QR scan

export function setBackendUrl(host: string, port: number) {
  BASE_URL = `http://${host}:${port}`
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
  ask: (sessionId: string, senderId: string, senderName: string, question: string, sessionTopic?: string) =>
    api.post('/ai/ask', { sessionId, senderId, senderName, question, sessionTopic }).then(r => r.data),

  command: (params: {
    sessionId?: string
    senderId: string
    senderName: string
    role: string
    input: string
    sessionTopic?: string
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
