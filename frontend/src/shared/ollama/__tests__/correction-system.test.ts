/**
 * Tests for CORRECTION_SYSTEM_TEMPLATE prompt quality.
 *
 * These tests call the real Ollama API (translategemma:12b) and verify that
 * the model returns correct error types for the 10 most common German mistakes
 * made by Spanish speakers.
 *
 * Run with: OLLAMA_TEST=1 vitest run correction-system.test.ts
 * Skip in CI (no Ollama): tests are gated on OLLAMA_TEST env var.
 */

import { describe, it, expect } from 'vitest'
import { buildPrompt } from '../promptBuilder'

const OLLAMA_URL = 'http://localhost:11434/api/generate'
const MODEL = 'translategemma:12b'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RUN_LIVE = !!(import.meta as any).env?.OLLAMA_TEST

async function callOllama(text: string, level: string): Promise<Record<string, unknown>> {
  const built = buildPrompt({ mode: 'correction', text, level: level as 'A2', explanationLang: 'es' })
  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      system: built.system,
      prompt: built.user,
      stream: false,
      format: 'json',
      options: { temperature: 0.1, top_p: 0.9, num_ctx: 4096 },
    }),
  })
  const data = (await response.json()) as { response: string }
  return JSON.parse(data.response) as Record<string, unknown>
}

function getErrorTypes(result: Record<string, unknown>): string[] {
  const errors = result.errors as Array<{ type: string }> | undefined
  return (errors ?? []).map((e) => e.type)
}

const skipIfNoOllama = RUN_LIVE ? it : it.skip

describe('CORRECTION_SYSTEM_TEMPLATE — 10 error categories for Spanish speakers', () => {
  /**
   * Category 1: Deklinationsfehler (Case errors)
   * Spanish speakers often ignore German case inflections since Spanish
   * doesn't mark case on articles the same way.
   */
  describe('1. Case / Declension errors', () => {
    skipIfNoOllama('Akkusativ: ein → einen', async () => {
      const result = await callOllama('Ich sehe ein Mann auf der Straße.', 'A2')
      expect(getErrorTypes(result)).toContain('case')
    })

    skipIfNoOllama('Genitiv: mein → meines', async () => {
      const result = await callOllama('Das Buch von mein Vater ist sehr alt.', 'B1')
      expect(getErrorTypes(result)).toContain('case')
    })

    skipIfNoOllama('Dativ after helfen: mein → meinem', async () => {
      const result = await callOllama('Ich helfe mein Freund bei den Hausaufgaben.', 'A2')
      expect(getErrorTypes(result)).toContain('case')
    })
  })

  /**
   * Category 2: Präpositionsfehler (Preposition errors)
   * Spanish prepositions don't govern cases, so learners forget that
   * German prepositions require specific cases on their complements.
   */
  describe('2. Preposition + case errors', () => {
    skipIfNoOllama('seit + Dativ: eine → einer', async () => {
      const result = await callOllama('Ich warte auf den Bus seit eine Stunde.', 'A2')
      expect(getErrorTypes(result)).toContain('case')
    })

    skipIfNoOllama('interessiert an + Dativ: die → der', async () => {
      const result = await callOllama('Er ist interessiert an die neue Technologie.', 'B1')
      expect(getErrorTypes(result)).toContain('case')
    })

    skipIfNoOllama('mit + Dativ: missing article', async () => {
      const result = await callOllama('Ich gehe in die Schule mit Zug.', 'A2')
      const types = getErrorTypes(result)
      expect(types.some((t) => t === 'case' || t === 'preposition')).toBe(true)
    })
  })

  /**
   * Category 3: Konjugationsfehler (Conjugation errors)
   * Wrong person/number, modal + zu-Infinitiv (wrong), double werden.
   */
  describe('3. Verb conjugation errors', () => {
    skipIfNoOllama('3rd person singular: haben → hat', async () => {
      const result = await callOllama('Er haben drei Kinder.', 'A1')
      expect(getErrorTypes(result)).toContain('conjugation')
    })

    skipIfNoOllama('Modal + bare infinitive (no zu): muss zu gehen', async () => {
      const result = await callOllama('Ich muss zu gehen zum Arzt.', 'A2')
      expect(getErrorTypes(result)).toContain('conjugation')
    })

    skipIfNoOllama('Double werden in Futur I: besuchen werden', async () => {
      const result = await callOllama('Nächste Woche werde ich meinen Bruder besuchen werden.', 'B1')
      expect(getErrorTypes(result)).toContain('conjugation')
    })
  })

  /**
   * Category 4: Nebensatz-Wortstellung (Subordinate clause word order)
   * Spanish uses SVO in all clauses; German requires verb-final in subordinate clauses.
   */
  describe('4. Subordinate clause word order', () => {
    skipIfNoOllama('dass + verb-final: kommt nicht → nicht kommt', async () => {
      const result = await callOllama('Ich glaube, dass er kommt nicht.', 'A2')
      expect(getErrorTypes(result)).toContain('word_order')
    })

    skipIfNoOllama('obwohl inversion in Hauptsatz', async () => {
      const result = await callOllama('Obwohl es regnet, er geht spazieren.', 'B1')
      expect(getErrorTypes(result)).toContain('word_order')
    })

    skipIfNoOllama('ob + verb-final: er hat das gemacht → er das gemacht hat', async () => {
      const result = await callOllama('Ich weiß nicht, ob er hat das gemacht.', 'B1')
      expect(getErrorTypes(result)).toContain('word_order')
    })
  })

  /**
   * Category 5: Modalverben (Modal verbs)
   * Spanish equivalents use full infinitive construction differently.
   */
  describe('5. Modal verb errors', () => {
    skipIfNoOllama('Modal + Infinitiv position (Satzklammer)', async () => {
      const result = await callOllama('Ich muss zu gehen zum Arzt.', 'A2')
      expect(getErrorTypes(result)).toContain('word_order')
    })

    skipIfNoOllama('Nebensatz: muss arbeiten → arbeiten muss', async () => {
      const result = await callOllama('Er kann nicht kommen, weil er muss arbeiten.', 'B1')
      expect(getErrorTypes(result)).toContain('word_order')
    })
  })

  /**
   * Category 6: Tempusfehler (Tense errors)
   * Confusion between Perfekt/Präteritum, and wrong tense in wenn-clauses.
   */
  describe('6. Tense errors', () => {
    skipIfNoOllama('V2 in Perfekt after time adverb', async () => {
      const result = await callOllama('Gestern ich habe gegessen zu viel.', 'B1')
      expect(getErrorTypes(result)).toContain('word_order')
    })

    skipIfNoOllama('als + Präteritum inversion', async () => {
      const result = await callOllama('Als ich klein war, ich spielte oft Fußball.', 'B2')
      expect(getErrorTypes(result)).toContain('word_order')
    })

    skipIfNoOllama('correct sentence: no errors expected', async () => {
      const result = await callOllama('Ich bin in Berlin geboren und dort aufgewachsen.', 'B1')
      expect(getErrorTypes(result)).toHaveLength(0)
    })
  })

  /**
   * Category 7: Futurformen (Future tense errors)
   * Spanish future is synthetic; Germans often use Präsens or haben issues with werden.
   */
  describe('7. Future tense errors', () => {
    skipIfNoOllama('werde + gehen (not gehe)', async () => {
      const result = await callOllama('Morgen ich werde gehe in die Stadt.', 'B1')
      const types = getErrorTypes(result)
      expect(types).toContain('word_order')
      expect(types).toContain('conjugation')
    })
  })

  /**
   * Category 8: Relativsätze & Subordinierte Sätze (Relative & subordinate clauses)
   */
  describe('8. Relative and subordinate clauses', () => {
    skipIfNoOllama('Relativpronomen Akkusativ: der → den', async () => {
      const result = await callOllama('Das ist der Mann, der ich gestern gesehen habe.', 'B1')
      expect(getErrorTypes(result)).toContain('case')
    })

    skipIfNoOllama('Punctuation: missing comma before warum', async () => {
      const result = await callOllama('Ich verstehe nicht warum er so handelt.', 'B1')
      expect(getErrorTypes(result)).toContain('punctuation')
    })
  })

  /**
   * Category 9: Wortstellung allgemein (General word order — V2 rule)
   * Spanish allows flexible SVO; German enforces V2 strictly.
   */
  describe('9. V2 and TeKaMoLo word order', () => {
    skipIfNoOllama('V2 after adverb: Jeden Tag ich gehe', async () => {
      const result = await callOllama('Jeden Tag ich gehe in die Schule.', 'A2')
      expect(getErrorTypes(result)).toContain('word_order')
    })

    skipIfNoOllama('Post-nominal adjective (Spanish transfer)', async () => {
      const result = await callOllama(
        'Ich habe gestern in Berlin eine Konferenz besucht sehr interessante.',
        'B1',
      )
      expect(getErrorTypes(result)).toContain('word_order')
    })

    skipIfNoOllama('Satzklammer: gegeben → ans Ende', async () => {
      const result = await callOllama('Er hat gegeben mir das Buch.', 'B2')
      expect(getErrorTypes(result)).toContain('word_order')
    })
  })

  /**
   * Category 10: Genus-Fehler (Gender errors)
   * German has 3 genders with no reliable mapping to Spanish nouns.
   */
  describe('10. Article gender errors', () => {
    skipIfNoOllama('der Tisch (masc): die → der', async () => {
      const result = await callOllama('Die Tisch ist sehr groß.', 'A1')
      expect(getErrorTypes(result)).toContain('gender')
    })

    skipIfNoOllama('das Auto (neut): eine → ein', async () => {
      const result = await callOllama('Ich kaufe eine neues Auto.', 'A2')
      expect(getErrorTypes(result)).toContain('gender')
    })

    skipIfNoOllama('das Problem (neut): Der → Das', async () => {
      const result = await callOllama('Der Problem ist sehr schwierig.', 'B1')
      expect(getErrorTypes(result)).toContain('gender')
    })
  })
})
