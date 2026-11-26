// Hand-written tables shown next to the AI explanation: they work without a
// model and are the part the learner can rely on.
import type { Language } from '@/i18n'
import type { ReferenceTable } from '@/features/common-errors/data/commonErrors'
import { getCommonErrors } from '@/features/common-errors/data/localize'

const CATEGORIES_BY_TYPE: Record<string, string[]> = {
  case: ['case', 'preposition'],
  declension: ['case'],
  agreement: ['case'],
  gender: ['gender'],
  preposition: ['preposition'],
  conjugation: ['conjugation', 'modal_verbs', 'reflexive'],
  separable_verb: ['separable_verb'],
}

export function referenceTablesFor(type: string, language: Language): ReferenceTable[] {
  const wanted = CATEGORIES_BY_TYPE[type] ?? []
  const categories = getCommonErrors(language)
  return wanted.flatMap(
    (id) => categories.find((category) => category.id === id)?.referenceTables ?? [],
  )
}
