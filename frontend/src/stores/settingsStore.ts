import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CORRECTION_SYSTEM_TEMPLATE } from '@/shared/ollama/templates/correction-system'
import { TRANSLATION_SYSTEM_TEMPLATE } from '@/shared/ollama/templates/translation-system'
import type { OllamaConfig, ModelParams, PromptOverrides, CEFRLevel } from '@/shared/types'

export const DEFAULT_MODEL_PARAMS: ModelParams = {
  temperature: 0.2,
  top_p: 0.9,
  num_ctx: 4096,
  timeout: 300000, // 5 min
}

interface SettingsState {
  ollama: OllamaConfig
  modelParams: ModelParams
  prompts: PromptOverrides
  lastCorrectionLevel: CEFRLevel
  lastTranslationLevel: CEFRLevel
  setOllama: (config: Partial<OllamaConfig>) => void
  setModelParams: (params: Partial<ModelParams>) => void
  setPrompts: (overrides: Partial<PromptOverrides>) => void
  resetPrompts: () => void
  setLastCorrectionLevel: (level: CEFRLevel) => void
  setLastTranslationLevel: (level: CEFRLevel) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ollama: {
        url: 'http://localhost',
        port: 11434,
        model: 'translategemma:12b',
      },
      modelParams: DEFAULT_MODEL_PARAMS,
      prompts: {
        correctionSystem: CORRECTION_SYSTEM_TEMPLATE,
        translationSystem: TRANSLATION_SYSTEM_TEMPLATE,
      },
      lastCorrectionLevel: 'B1',
      lastTranslationLevel: 'B1',
      setOllama: (config) =>
        set((state) => ({ ollama: { ...state.ollama, ...config } })),
      setModelParams: (params) =>
        set((state) => ({ modelParams: { ...state.modelParams, ...params } })),
      setPrompts: (overrides) =>
        set((state) => ({ prompts: { ...state.prompts, ...overrides } })),
      resetPrompts: () =>
        set(() => ({
          prompts: {
            correctionSystem: CORRECTION_SYSTEM_TEMPLATE,
            translationSystem: TRANSLATION_SYSTEM_TEMPLATE,
          },
        })),
      setLastCorrectionLevel: (level) => set({ lastCorrectionLevel: level }),
      setLastTranslationLevel: (level) => set({ lastTranslationLevel: level }),
    }),
    { name: 'speak-mentor-settings' }
  )
)
