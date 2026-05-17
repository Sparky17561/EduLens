import { create } from 'zustand'

export interface QuizQuestion {
  index: number
  question: string
  options: string[]
  topic: string
}

export interface HomeworkData {
  followUpQuestions: string[]
  revisionTasks: string[]
  conceptRecap: string
  practiceChallenge: string
  askTeacherPrompts: string[]
}

export interface QuizResult {
  score: number
  total: number
  percentage: number
  weakTopics: string[]
  strongTopics: string[]
  topicBreakdown: Record<string, number>
  homework: HomeworkData
  reportId: string
}

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  role: 'teacher' | 'student' | 'ai'
  content: string
  messageType: string
  createdAt: string
}

export interface SessionState {
  // Student identity
  student: { id: string; name: string } | null
  setStudent: (s: { id: string; name: string } | null) => void

  // Session
  session: { id: string; code: string; topic: string; host: string; port: number } | null
  setSession: (s: SessionState['session']) => void

  // Chat
  messages: ChatMessage[]
  addMessage: (m: ChatMessage) => void

  // Quiz
  activeQuiz: { quizId: string; questions: QuizQuestion[] } | null
  setActiveQuiz: (q: SessionState['activeQuiz']) => void
  quizResult: QuizResult | null
  setQuizResult: (r: QuizResult) => void

  // Status
  sessionEnded: boolean
  setSessionEnded: (v: boolean) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  student: null,
  setStudent: (student) => set({ student }),

  session: null,
  setSession: (session) => set({ session, messages: [], activeQuiz: null, quizResult: null, sessionEnded: false }),

  messages: [],
  addMessage: (m) => set(s => {
    if (s.messages.find(x => x.id === m.id)) return s
    const localPlaceholderIdx = s.messages.findIndex(
      x => x.id.startsWith('local-') && x.content === m.content && x.senderId === m.senderId
    )
    if (localPlaceholderIdx !== -1) {
      const updated = [...s.messages]
      updated[localPlaceholderIdx] = m
      return { messages: updated }
    }
    return { messages: [...s.messages, m] }
  }),

  activeQuiz: null,
  setActiveQuiz: (activeQuiz) => set({ activeQuiz }),

  quizResult: null,
  setQuizResult: (quizResult) => set({ quizResult }),

  sessionEnded: false,
  setSessionEnded: (sessionEnded) => set({ sessionEnded })
}))
