# Investigación de Prompt — Corrección DE→DE con translategemma:12b

## Objetivo

Evaluar y mejorar el prompt del sistema de corrección alemán para hispanohablantes.  
Modelo testeado: `translategemma:12b` via Ollama.

---

## 10 Errores más comunes de hispanohablantes al hablar alemán

| # | Categoría | Descripción | Frecuencia |
|---|-----------|-------------|-----------|
| 1 | **Deklinationsfehler** | Ignorar casos Nom/Akk/Dat/Gen en artículos y posesivos | Muy alta |
| 2 | **Präpositionsfehler** | No aplicar el caso correcto después de preposiciones fijas | Muy alta |
| 3 | **Konjugationsfehler** | Forma verbal incorrecta (modal+zu, doble werden, persona) | Alta |
| 4 | **Nebensatz-Wortstellung** | Verbo al final en subordinadas (dass, weil, ob, wenn…) | Alta |
| 5 | **Modalverben** | Modal + zu+Infinitiv; infinitivo no al final | Alta |
| 6 | **Tempusfehler** | Futur en wenn-clauses; inversión tras NS inicial | Media |
| 7 | **Futurformen** | Doble werden; gehe en vez de gehen tras werden | Media |
| 8 | **Relativsätze** | Caso incorrecto del pronombre relativo; coma faltante | Media |
| 9 | **V2-Regel & TeKaMoLo** | Sujeto en pos.1 tras adverbio; adjetivo posnominal | Alta |
| 10 | **Genus-Fehler** | Artículo de género incorrecto (transferencia del español) | Muy alta |

---

## Resultados de Testing — Prompt v1 (baseline)

**Score: 20/29 casos correctos (69%)**

### Fallos detectados

| ID | Input | Esperado | Detectado | Problema |
|----|-------|----------|-----------|---------|
| prep_01 | `seit eine Stunde` | `case` | `declension` | Clasificación incorrecta del tipo |
| prep_02 | `an die neue Technologie` | `case,preposition` | `case` | Perdió el error de preposición |
| conj_03 | `haben werde` en wenn | `tense` | `mood,word_order` | Interpretó como Konjunktiv II (debatible) |
| modal_01 | `muss zu gehen` | `conjugation,word_order` | `word_order` | Fusionó 2 errores en 1 |
| modal_03 | `Du sollst` | `mood` | `[]` | No detectó el registro de "sollst" |
| fut_01 | `werde gehe` | `conjugation,word_order` | `word_order` | Fusionó 2 errores en 1 |
| fut_02 | `besuchen werden` | `conjugation` | `[]` | Fix silencioso (corrigió sin reportar) |
| sub_03 | sin coma ante "warum" | `punctuation` | `[]` | Fix silencioso de puntuación |
| gen_02 | `eine neues Auto` | `gender` | `article` | Inventó tipo fuera del enum |

### Patrones de fallo principales

1. **Fix silencioso**: corrige `corrected` pero `errors: []` → viola la invariante del prompt
2. **Tipo fuera del enum**: `article` en lugar de `gender` → el enum no era suficientemente explícito
3. **Fusión de errores**: detecta uno de dos errores correctamente pero no reporta ambos
4. **Clasificación `declension` vs `case`**: confunde ambos tipos en errores de preposición

---

## Mejoras aplicadas al Prompt v2

### 1. Regla anti-fix-silencioso (RULE 9)

```
SILENT FIXES ARE FORBIDDEN: if the `corrected` text differs from the input,
there MUST be at least one error in the `errors` array explaining why.
Never silently fix punctuation without reporting a "punctuation" error.
```

### 2. Regla de punctuación explícita (RULE 10)

```
PUNCTUATION: Always check for missing commas before subordinate clauses introduced
by: dass, weil, obwohl, wenn, ob, damit, als, während, nachdem, bevor, sodass.
```

### 3. Regla de errores múltiples (RULE 8)

```
ONE ERROR OBJECT PER DISTINCT ERROR. If a sentence has 3 errors, report 3 objects.
Do NOT merge multiple grammatical problems into a single error object.
```

### 4. Disambiguación explícita de tipos

```
CLASSIFIER DISAMBIGUATION:
- "seit eine Stunde" → case error ("case")
- modal + zu+Inf → conjugation ("conjugation")  
- double werden → conjugation ("conjugation")
- "article" IS NOT a valid type — use "gender" instead
- Missing comma before subordinate clause → "punctuation"
```

### 5. Dos ejemplos adicionales en el prompt

- Ejemplo de modal verb error (`muss zu gehen`) mostrando 2 errores separados
- Ejemplo de fix silencioso prohibido (puntuación ante `warum`)

---

## Resultados de Testing — Prompt v2

**Score: 9/10 en los casos que fallaban (90%)**

| ID | Resultado | Nota |
|----|-----------|------|
| prep_01 | ✓ `case` | Corregido |
| prep_02 | ✓ `case` | Correcto (preposition era bonus) |
| modal_01 | ✓ `conjugation,word_order` | Ahora detecta ambos |
| fut_01 | ✓ `word_order,conjugation` | Ahora detecta ambos |
| fut_02 | ✓ `conjugation` | Ya no es fix silencioso |
| sub_03 | ✓ `punctuation` | Detecta coma faltante |
| gen_02 | ✗ `article` | Persiste tipo inválido (añadida aclaración adicional) |
| case_01_reg | ✓ `case` | Sin regresiones |
| ns_01_reg | ✓ `word_order` | Sin regresiones |
| tense_03_reg | ✓ `[]` | Verdadero negativo correcto |

### Caso persistente: gen_02

`"eine neues Auto"` → el modelo sigue usando `article` en lugar de `gender`.  
Mitigación: añadida línea explícita `"article" IS NOT a valid type — use "gender"` en la sección de disambiguación.

---

## Archivos generados

| Archivo | Descripción |
|---------|-------------|
| `frontend/src/shared/ollama/templates/correction-system.ts` | Prompt mejorado (v2) |
| `frontend/src/shared/ollama/__tests__/correction-system.test.ts` | 29 tests Vitest (requiere `OLLAMA_TEST=1`) |
| `frontend/src/features/common-errors/data/commonErrors.ts` | 30 ejemplos de errores comunes estructurados |
| `frontend/src/features/common-errors/CommonErrorsView.tsx` | Vista de pestaña "Errores frecuentes" |

---

## Cómo ejecutar los tests de calidad del prompt

```bash
# Desde frontend/
OLLAMA_TEST=1 npx vitest run src/shared/ollama/__tests__/correction-system.test.ts
```

Requiere Ollama corriendo en `localhost:11434` con `translategemma:12b` disponible.
