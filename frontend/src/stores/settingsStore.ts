import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OllamaConfig } from '@/shared/types'

interface SettingsState {
  ollama: OllamaConfig
  setOllama: (config: Partial<OllamaConfig>) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ollama: {
        url: 'http://localhost',
        port: 11434,
        model: 'translategemma:12b',
      },
      setOllama: (config) =>
        set((state) => ({ ollama: { ...state.ollama, ...config } })),
    }),
    { name: 'speak-mentor-settings' }
  )
)
