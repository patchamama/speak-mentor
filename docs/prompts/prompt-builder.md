# Prompt Builder — runtime assembly

Frontend assembles the final prompt at call time. This doc defines the assembly contract.

## Module: `shared/ollama/promptBuilder.ts`

### Public API

```ts
type Mode = 'correction' | 'translation';
type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
type Lang = 'de' | 'es';

interface CorrectionPromptInput {
  mode: 'correction';
  text: string;
  level: Level;
  explanationLang: Lang;          // default 'es'
}

interface TranslationPromptInput {
  mode: 'translation';
  text: string;
  sourceLang: Lang;
  targetLang: Lang;
  level: Level;
  explanationLang: Lang;          // default 'es'
}

type PromptInput = CorrectionPromptInput | TranslationPromptInput;

interface BuiltPrompt {
  system: string;                  // full system prompt with examples
  user: string;                    // user turn, plain text input
  format: 'json';                  // forced
  options: {
    temperature: number;
    top_p: number;
    num_ctx: number;
  };
}

function buildPrompt(input: PromptInput): BuiltPrompt;
```

### Behavior

1. Load the appropriate template (`correction-de-de.md` or `translation.md`).
2. Substitute `{{LEVEL}}`, `{{EXPLANATION_LANG}}`, etc. via simple `replaceAll`.
3. Resolve `{{EXPLANATION_LANG_FULL}}` from a map: `es → Spanish`, `de → German`.
4. Embed all few-shot examples inline in the system prompt — Ollama does not have a separate examples channel.
5. The `user` field is just `TEXT: {{TEXT}}` (no decoration), so the LLM sees a clean input boundary.
6. Force `format: 'json'` and the documented `options`.

### Templates location

Templates live in `frontend/src/shared/ollama/templates/`:
- `correction-system.ts` — exports the system prompt string with placeholders
- `translation-system.ts` — same

Keep templates as TS string constants (not Markdown imports) so the bundler ships them inline and tree-shaking works.

### Validation

After parsing the LLM JSON response, validate with **Zod**:

```ts
import { z } from 'zod';

const ErrorTypeEnum = z.enum([
  'gender','case','declension','conjugation','preposition',
  'word_order','spelling','punctuation','vocabulary','style',
  'agreement','tense','mood','voice','particle'
]);

const SeverityEnum = z.enum(['critical','major','minor']);
const LevelEnum = z.enum(['A1','A2','B1','B2','C1','C2']);

export const CorrectionResponseSchema = z.object({
  corrected: z.string(),
  level_assessment: z.object({
    detected_level: LevelEnum,
    target_level: LevelEnum,
    gap_notes: z.string()
  }),
  errors: z.array(z.object({
    original: z.string(),
    correction: z.string(),
    type: ErrorTypeEnum,
    severity: SeverityEnum,
    position: z.object({ start: z.number().int(), end: z.number().int() }),
    explanation: z.string(),
    rule_reference: z.string(),
    example: z.string()
  })),
  summary: z.object({
    error_count: z.number().int(),
    by_type: z.record(z.string(), z.number()),
    main_focus: z.string()
  }),
  tips: z.array(z.string()).max(3)
});

export type CorrectionResponse = z.infer<typeof CorrectionResponseSchema>;
```

If validation fails: retry ONCE with `temperature: 0.0` and a system note "Previous output was invalid JSON. Return strict JSON matching the schema." If second fails, surface error to user with raw output for debugging.

### Position offset recovery

LLMs frequently get character positions wrong. After validation:

1. For each error, search the original text for `error.original`.
2. If found exactly once → trust the LLM position, but override with the real index.
3. If found multiple times → use LLM-provided position as disambiguator (clamp to nearest match).
4. If not found → mark error with `position: null` and flag `position_unreliable: true`. UI shows the error in the side panel but does not highlight inline.

This is the single most important post-processing step. Do not skip it.
