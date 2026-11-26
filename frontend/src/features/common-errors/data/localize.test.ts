import { describe, it, expect } from 'vitest'
import { getCommonErrors } from './localize'

const spanish = getCommonErrors('es')
const german = getCommonErrors('de')

const texts = german.flatMap((c) => [
  c.title,
  ...c.examples.flatMap((e) => [e.explanation, e.rule, e.tip]),
  ...(c.referenceTables ?? []).flatMap((t) => [t.title, ...t.headers, ...t.rows.flat(), t.note ?? '']),
])

// Spanish words that must not survive. Accents alone miss unaccented text.
const SPANISH = /[áéíóúñ¿¡]|(?<![\wäöüß])(el|las|del|una|con|para|siempre|verbos?|cambio|ejemplos?)(?![\wäöüß])/i

describe('German common errors', () => {
  it('leaves no Spanish text', () => {
    // A quoted Spanish phrase being contrasted, and German "Café".
    const allowed = ['una conferencia muy interesante', 'Das Café']
    expect(texts.filter((t) => SPANISH.test(t) && !allowed.some((a) => t.includes(a)))).toEqual([])
  })

  it('translates every explanation and tip', () => {
    german.forEach((category, i) => {
      category.examples.forEach((example, j) => {
        expect(example.explanation).not.toBe(spanish[i].examples[j].explanation)
        // A tip that is only a German quotation stays as it is.
        const source = spanish[i].examples[j].tip
        if (!source.startsWith('"Ich fahre')) expect(example.tip).not.toBe(source)
        expect(example.wrong).toBe(spanish[i].examples[j].wrong)
        expect(example.correct).toBe(spanish[i].examples[j].correct)
      })
    })
  })
})
