import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface Profile {
  id: string
  name: string
  avatar: string
  grade: string
  lang: string
  pin: string
}

export interface SessionRecord {
  id: string
  sessionId: string
  code: string
  topic: string
  date: string
  durationSeconds: number
  quizScore?: number
  quizTotal?: number
  quizPercentage?: number
  weakTopics?: string[]
  strongTopics?: string[]
  strongTopicsData?: string[]
  topicBreakdown?: Record<string, number>
  homework?: {
    followUpQuestions: string[]
    revisionTasks: string[]
    conceptRecap: string
    practiceChallenge: string
    askTeacherPrompts: string[]
  }
  reportId?: string
}

interface ProfileState {
  profiles: Profile[]
  activeProfileId: string | null
  onboarded: boolean
  sessionHistory: SessionRecord[]

  setOnboarded: () => void
  addProfile: (p: Profile) => void
  updateProfile: (id: string, partial: Partial<Profile>) => void
  setActiveProfile: (id: string) => void
  getActiveProfile: () => Profile | null
  deleteProfile: (id: string) => void
  addSessionRecord: (r: SessionRecord) => void
  clearSessionHistory: () => void
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profiles: [],
      activeProfileId: null,
      onboarded: false,
      sessionHistory: [],

      setOnboarded: () => set({ onboarded: true }),

      addProfile: (p) => set(s => ({ profiles: [...s.profiles, p] })),

      updateProfile: (id, partial) => set(s => ({
        profiles: s.profiles.map(p => p.id === id ? { ...p, ...partial } : p)
      })),

      setActiveProfile: (id) => set({ activeProfileId: id }),

      getActiveProfile: () => {
        const { profiles, activeProfileId } = get()
        return profiles.find(p => p.id === activeProfileId) || null
      },

      deleteProfile: (id) => set(s => ({
        profiles: s.profiles.filter(p => p.id !== id),
        activeProfileId: s.activeProfileId === id ? null : s.activeProfileId
      })),

      addSessionRecord: (r) => set(s => {
        if (s.sessionHistory.some(x => x.sessionId === r.sessionId)) return s
        return { sessionHistory: [r, ...s.sessionHistory].slice(0, 50) }
      }),

      clearSessionHistory: () => set({ sessionHistory: [] }),
    }),
    {
      name: 'edulens-profiles',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
)
