export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
export type Lang = 'de' | 'es'
export type Mode = 'correction' | 'translation'

export type CorrectionPassId = 'correction' | 'vocabulary' | 'exercises'

export interface CorrectionPipelineConfig {
  passes: CorrectionPassId[]
}

export const DEFAULT_PIPELINE_CONFIG: CorrectionPipelineConfig = {
  passes: ['correction', 'vocabulary', 'exercises'],
}

export type GermanErrorType =
  | 'gender'
  | 'case'
  | 'declension'
  | 'conjugation'
  | 'separable_verb'
  | 'preposition'
  | 'word_order'
  | 'spelling'
  | 'punctuation'
  | 'vocabulary'
  | 'style'
  | 'agreement'
  | 'tense'
  | 'mood'
  | 'voice'
  | 'particle'

export interface OllamaConfig {
  url: string
  port: number
  model: string
}

export interface ModelParams {
  temperature: number
  top_p: number
  num_ctx: number
  timeout: number        // ms
}

export interface PromptOverrides {
  correctionSystem: string
  translationSystem: string
}

export interface ErrorItem {
  id?: number
  original: string
  correction: string
  type: string
  severity: 'critical' | 'major' | 'minor'
  position_start?: number
  position_end?: number
  position_unreliable?: boolean
  explanation: string
  rule_reference?: string
  example?: string
}

export interface Session {
  id?: number
  mode: Mode
  source_lang: Lang
  target_lang: Lang
  level: CEFRLevel
  input_text: string
  output_text: string
  raw_llm?: string
  model?: string
  errors?: ErrorItem[]
  created_at?: string
}
