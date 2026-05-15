import { create } from 'zustand'
import type { CEFRLevel, Lang, Mode } from '@/shared/types'

interface SessionDraft {
  mode: Mode
  level: CEFRLevel
  sourceLang: Lang
  targetLang: Lang
  inputText: string
  setMode: (mode: Mode) => void
  setLevel: (level: CEFRLevel) => void
  setSourceLang: (lang: Lang) => void
  setTargetLang: (lang: Lang) => void
  setInputText: (text: string) => void
  reset: () => void
}

const defaults = {
  mode: 'correction' as Mode,
  level: 'B1' as CEFRLevel,
  sourceLang: 'de' as Lang,
  targetLang: 'de' as Lang,
  inputText: '',
}

export const useSessionStore = create<SessionDraft>()((set) => ({
  ...defaults,
  setMode: (mode) => set({ mode }),
  setLevel: (level) => set({ level }),
  setSourceLang: (sourceLang) => set({ sourceLang }),
  setTargetLang: (targetLang) => set({ targetLang }),
  setInputText: (inputText) => set({ inputText }),
  reset: () => set(defaults),
}))
