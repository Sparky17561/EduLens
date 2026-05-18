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
  ask: (sessionId: string, senderId: string, senderName: string, question: string) =>
    api.post('/ai/ask', { sessionId, senderId, senderName, question }).then(r => r.data)
}

export const quizApi = {
  submit: (quizId: string, sessionId: string, studentId: string, studentName: string, answers: any[]) =>
    api.post('/quiz/submit', { quizId, sessionId, studentId, studentName, answers }).then(r => r.data)
}

export const reportApi = {
  get: (sessionId: string) =>
    api.get(`/report/${sessionId}`).then(r => r.data)
}

export default api
