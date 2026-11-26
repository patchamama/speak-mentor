// Spanish source text is the lookup key; `de.ts` holds the German version.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { de } from './de'

export type Language = 'es' | 'de'

export const LANGUAGES: { id: Language; name: string }[] = [
  { id: 'es', name: 'Español' },
  { id: 'de', name: 'Deutsch' },
]

function browserLanguage(): Language {
  return typeof navigator !== 'undefined' && navigator.language.startsWith('de') ? 'de' : 'es'
}

interface LanguageState {
  language: Language
  setLanguage: (language: Language) => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: browserLanguage(),
      setLanguage: (language) => set({ language }),
    }),
    { name: 'speak-mentor-language' },
  ),
)

export function getLanguage(): Language {
  return useLanguageStore.getState().language
}

/**
 * Translates at call time. `App` subscribes to the language, so a change
 * re-renders the whole tree.
 */
export function t(text: string, vars: Record<string, string | number> = {}): string {
  const translated = getLanguage() === 'de' ? (de[text] ?? text) : text
  return translated.replace(/\{(\w+)\}/g, (match, name) =>
    name in vars ? String(vars[name]) : match,
  )
}

/** Marks text declared outside render; translate it later with `t`. */
export const msg = (text: string): string => text

export function dateLocale(): string {
  return getLanguage() === 'de' ? 'de-DE' : 'es-ES'
}
