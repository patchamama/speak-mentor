import { msg, t } from '@/i18n'

const LABELS: Record<string, string> = {
  gender: msg('Género'),
  case: msg('Caso'),
  declension: msg('Declinación'),
  conjugation: msg('Conjugación'),
  separable_verb: msg('V. Separable'),
  preposition: msg('Preposición'),
  word_order: msg('Orden'),
  spelling: msg('Ortografía'),
  punctuation: msg('Puntuación'),
  vocabulary: msg('Vocabulario'),
  style: msg('Estilo'),
  agreement: msg('Concordancia'),
  tense: msg('Tiempo'),
  mood: msg('Modo'),
  voice: msg('Voz'),
  particle: msg('Partícula'),
}

/** Types about wording or typing, where a grammar lesson makes no sense. */
const NOT_GRAMMAR = new Set(['spelling', 'punctuation', 'vocabulary', 'style'])

export function errorTypeLabel(type: string): string {
  return LABELS[type] ? t(LABELS[type]) : type
}

export function isGrammarError(type: string): boolean {
  return !NOT_GRAMMAR.has(type)
}
