import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface QuizQuestion {
  index: number
  question: string
  options: string[]
  topic: string
  questionType?: 'mcq' | 'short_answer' | 'true_false' | 'match' | 'fill_blank'
  matchPairs?: { left: string; right: string }[]
  blanks?: string[]
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
  citations?: Array<{ label?: string; source?: string; chapter?: string; page?: number }>
  confidence?: 'high' | 'medium' | 'low'
  confidenceNote?: string
}

export interface QueuedMessage {
  id: string
  content: string
  createdAt: string
}

export interface Flashcard {
  front: string
  back: string
}

export interface ReteachPlan {
  id: string
  topic: string
  lessonSummary: string
  conceptExplanation: string
  exercises: string[]
  examples: string[]
  homework: { followUpQuestions?: string[]; revisionTasks?: string[] }
}

export interface SessionState {
  // Student identity
  student: { id: string; name: string } | null
  setStudent: (s: { id: string; name: string } | null) => void

  // Session
  session: { id: string; code: string; topic: string; host: string; port: number } | null
  setSession: (s: SessionState['session']) => void
  clearSession: () => void

  // Chat
  messages: ChatMessage[]
  addMessage: (m: ChatMessage) => void

  // Offline Queue
  offlineQueue: QueuedMessage[]
  queueMessage: (content: string) => void
  clearQueue: () => void

  // Quiz
  activeQuiz: { quizId: string; questions: QuizQuestion[] } | null
  setActiveQuiz: (q: SessionState['activeQuiz']) => void
  quizResult: QuizResult | null
  setQuizResult: (r: QuizResult) => void

  // Completed quiz IDs — NOT cleared on clearSession so rejoin doesn't re-show quiz
  completedQuizIds: string[]
  markQuizCompleted: (quizId: string) => void

  // Flashcards
  flashcards: Flashcard[]
  setFlashcards: (cards: Flashcard[]) => void

  // Status
  sessionEnded: boolean
  setSessionEnded: (v: boolean) => void

  // Pending quiz notification (show popup, don't force navigate)
  pendingQuiz: boolean
  setPendingQuiz: (v: boolean) => void

  // Homework generation state
  homeworkGenerating: boolean
  setHomeworkGenerating: (v: boolean) => void

  // Reteach
  reteachPlans: ReteachPlan[]
  addReteachPlan: (plan: ReteachPlan) => void

  // Sync
  syncPending: number
  setSyncPending: (n: number) => void
  ttsLanguage: string
  setTtsLanguage: (lang: string) => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      student: null,
      setStudent: (student) => set({ student }),

      session: null,
      setSession: (session) => set({ session, messages: [], activeQuiz: null, quizResult: null, flashcards: [], sessionEnded: false, pendingQuiz: false, reteachPlans: [] }),
      // clearSession keeps completedQuizIds and quizResult so reports are accessible after leaving session
      clearSession: () => set({ session: null, messages: [], activeQuiz: null, flashcards: [], sessionEnded: false, pendingQuiz: false, reteachPlans: [] }),

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

      offlineQueue: [],
      queueMessage: (content) => set(s => ({
        offlineQueue: [...s.offlineQueue, { id: Date.now().toString(), content, createdAt: new Date().toISOString() }]
      })),
      clearQueue: () => set({ offlineQueue: [] }),

      activeQuiz: null,
      setActiveQuiz: (activeQuiz) => set({ activeQuiz }),

      quizResult: null,
      setQuizResult: (quizResult) => set({ quizResult }),

      completedQuizIds: [],
      markQuizCompleted: (quizId) => set(s => ({
        completedQuizIds: s.completedQuizIds.includes(quizId)
          ? s.completedQuizIds
          : [...s.completedQuizIds, quizId]
      })),

      flashcards: [],
      setFlashcards: (flashcards) => set({ flashcards }),

      sessionEnded: false,
      setSessionEnded: (sessionEnded) => set({ sessionEnded }),

      pendingQuiz: false,
      setPendingQuiz: (pendingQuiz) => set({ pendingQuiz }),

      homeworkGenerating: false,
      setHomeworkGenerating: (homeworkGenerating) => set({ homeworkGenerating }),

      reteachPlans: [],
      addReteachPlan: (plan) => set(s => ({
        reteachPlans: s.reteachPlans.find(p => p.id === plan.id) ? s.reteachPlans : [...s.reteachPlans, plan]
      })),

      syncPending: 0,
      setSyncPending: (syncPending) => set({ syncPending }),

      ttsLanguage: 'en-IN',
      setTtsLanguage: (ttsLanguage) => set({ ttsLanguage }),
    }),
    {
      name: 'edulens-session-storage',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
)
