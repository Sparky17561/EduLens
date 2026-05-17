import { create } from 'zustand'

export interface Student {
  id: string
  name: string
  joinedAt: string
  score?: number
  percentage?: number
  weakTopics?: string[]
  strongTopics?: string[]
  topicBreakdown?: Record<string, number>
  homework?: any
}

export interface ChatMessage {
  id: string
  sessionId: string
  senderId: string
  senderName: string
  role: 'teacher' | 'student' | 'ai'
  content: string
  messageType: 'chat' | 'ask' | 'generate' | 'system'
  createdAt: string
}

export interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: string
  topic: string
}

export interface ActiveSession {
  id: string
  code: string
  topic: string
  qrDataUrl: string
  hostIp: string
  port: number
  joinUrl: string
  startedAt: string
}

export interface AppState {
  // Auth
  teacher: { id: string; name: string } | null
  setTeacher: (teacher: { id: string; name: string } | null) => void

  // Session
  activeSession: ActiveSession | null
  setActiveSession: (session: ActiveSession | null) => void

  // Students
  students: Student[]
  addStudent: (student: Student) => void
  removeStudent: (studentId: string) => void
  updateStudent: (studentId: string, updates: Partial<Student>) => void

  // Chat
  messages: ChatMessage[]
  addMessage: (message: ChatMessage) => void
  setMessages: (messages: ChatMessage[]) => void

  // Quiz
  activeQuizId: string | null
  setActiveQuizId: (id: string | null) => void
  quizResults: Student[]
  addQuizResult: (result: Student) => void

  // AI
  aiProvider: string
  aiAvailable: boolean
  setAiStatus: (provider: string, available: boolean) => void

  // UI
  isLoading: boolean
  setLoading: (v: boolean) => void
  error: string | null
  setError: (e: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  teacher: null,
  setTeacher: (teacher) => set({ teacher }),

  activeSession: null,
  setActiveSession: (session) =>
    set({ activeSession: session, students: [], messages: [], activeQuizId: null, quizResults: [] }),

  students: [],
  addStudent: (student) =>
    set((s) => {
      if (s.students.find((x) => x.id === student.id)) return s
      return { students: [...s.students, student] }
    }),
  removeStudent: (studentId) =>
    set((s) => ({ students: s.students.filter((x) => x.id !== studentId) })),
  updateStudent: (studentId, updates) =>
    set((s) => ({
      students: s.students.map((x) => (x.id === studentId ? { ...x, ...updates } : x))
    })),

  messages: [],
  addMessage: (message) =>
    set((s) => {
      if (s.messages.find((x) => x.id === message.id)) return s
      return { messages: [...s.messages, message] }
    }),
  setMessages: (messages) => set({ messages }),

  activeQuizId: null,
  setActiveQuizId: (id) => set({ activeQuizId: id }),
  quizResults: [],
  addQuizResult: (result) =>
    set((s) => {
      const exists = s.quizResults.find((x) => x.id === result.id)
      if (exists) {
        return { quizResults: s.quizResults.map((x) => (x.id === result.id ? { ...x, ...result } : x)) }
      }
      return { quizResults: [...s.quizResults, result] }
    }),

  aiProvider: 'Groq (cloud)',
  aiAvailable: false,
  setAiStatus: (provider, available) => set({ aiProvider: provider, aiAvailable: available }),

  isLoading: false,
  setLoading: (v) => set({ isLoading: v }),
  error: null,
  setError: (e) => set({ error: e })
}))
