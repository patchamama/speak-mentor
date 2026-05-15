import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'
import { LevelSelector } from '@/shared/ui/LevelSelector'
import { InputHistory } from '@/shared/ui/InputHistory'
import { useInputHistory } from '@/shared/hooks/useInputHistory'
import { useSettingsStore } from '@/stores/settingsStore'
import { saveSession } from '@/shared/api/flaskClient'
import { ErrorHighlight, ERROR_COLORS_MAP } from './components/ErrorHighlight'
import { ErrorPanel } from './components/ErrorPanel'
import { TipsList } from './components/TipsList'
import { VocabularyPanel } from './components/VocabularyPanel'
import { ExercisesPanel } from './components/ExercisesPanel'
import { PassStatusBar } from './components/PassStatusBar'
import { useCorrectionPipeline } from './hooks/useCorrectionPipeline'
import type { CEFRLevel, CorrectionPassId } from '@/shared/types'

const ERROR_TYPE_LABELS: Record<string, string> = {
  gender: 'Género',
  case: 'Caso',
  declension: 'Declinación',
  conjugation: 'Conjugación',
  separable_verb: 'V. Separable',
  preposition: 'Preposición',
  word_order: 'Orden',
  spelling: 'Ortografía',
  punctuation: 'Puntuación',
  vocabulary: 'Vocabulario',
  style: 'Estilo',
  agreement: 'Concordancia',
  tense: 'Tiempo',
  mood: 'Modo',
  voice: 'Voz',
  particle: 'Partícula',
}

export function CorrectionContainer() {
  const { lastCorrectionLevel, pipeline, ollama } = useSettingsStore()
  const [text, setText] = useState('')
  const [level, setLevel] = useState<CEFRLevel>(lastCorrectionLevel)
  const [activeErrorIdx, setActiveErrorIdx] = useState<number | null>(null)
  const [advanced, setAdvanced] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedSessionId, setSavedSessionId] = useState<number | null>(null)
  const { history, push, remove } = useInputHistory('speak-mentor-correction-history')

  const { state, run, isRunning, activePasses } = useCorrectionPipeline()

  const effectivePasses: CorrectionPassId[] = advanced ? pipeline.passes : ['correction']

  const handleSubmit = useCallback(() => {
    if (!text.trim() || isRunning) return
    setActiveErrorIdx(null)
    setSavedSessionId(null)
    push(text)
    run(text, level, 'es', advanced ? pipeline.passes : ['correction'])
  }, [text, level, isRunning, run, push, advanced, pipeline.passes])

  const handleSave = useCallback(async () => {
    const correctionData = state.correction.data
    if (!correctionData) return
    setSaving(true)
    try {
      const { session_id } = await saveSession({
        mode: 'correction',
        source_lang: 'de',
        target_lang: 'de',
        level,
        input_text: text,
        output_text: correctionData.corrected,
        raw_llm: JSON.stringify(correctionData),
        model: ollama.model,
        errors: correctionData.errors.map((e) => ({
          type: e.type,
          original: e.original,
          correction: e.correction,
          severity: e.severity,
          explanation: e.explanation,
          rule_reference: e.rule_reference,
        })),
      })
      setSavedSessionId(session_id)
      toast.success('Sesión guardada en el historial')
    } catch {
      toast.error('Error al guardar la sesión')
    } finally {
      setSaving(false)
    }
  }, [state.correction.data, level, text, ollama.model])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit()
    },
    [handleSubmit],
  )

  const correctionResult = state.correction.data
  const vocabResult = state.vocabulary.data
  const exercisesResult = state.exercises.data

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Corrección</h2>
            <InputHistory
              history={history}
              onSelect={(entry) => { setText(entry); setActiveErrorIdx(null) }}
              onRemove={remove}
            />
          </div>
          <LevelSelector value={level} onChange={setLevel} />
        </div>
        <textarea
          className="w-full min-h-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Escribe en alemán... (Cmd+Enter para corregir)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={2000}
          aria-label="Texto en alemán para corregir"
        />
        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={handleSubmit} disabled={isRunning || !text.trim()} aria-busy={isRunning}>
            {isRunning ? <><Spinner className="mr-2" />Analizando...</> : 'Corregir'}
          </Button>
          {state.correction.status === 'done' && !savedSessionId && (
            <Button variant="outline" onClick={handleSave} disabled={saving}>
              {saving ? <><Spinner className="mr-2" />Guardando...</> : 'Guardar'}
            </Button>
          )}
          {savedSessionId && (
            <span className="text-sm text-muted-foreground">✓ Guardado (#{savedSessionId})</span>
          )}
          <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
            <div
              role="switch"
              aria-checked={advanced}
              tabIndex={0}
              onClick={() => setAdvanced((a) => !a)}
              onKeyDown={(e) => e.key === ' ' && setAdvanced((a) => !a)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${advanced ? 'bg-primary' : 'bg-muted-foreground/30'}`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${advanced ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <span className={advanced ? 'text-foreground' : 'text-muted-foreground'}>
              Análisis avanzado
            </span>
            {advanced && pipeline.passes.length > 1 && (
              <span className="text-xs text-muted-foreground">
                ({effectivePasses.filter(p => p !== 'correction').join(' + ')})
              </span>
            )}
          </label>
          <span className="ml-auto text-xs text-muted-foreground">{text.length}/2000</span>
        </div>
      </div>

      {/* Pipeline status bar */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <PassStatusBar passes={activePasses} states={state as any} />

      {/* Correction error */}
      {state.correction.status === 'error' && (
        <div className="rounded-md border border-destructive p-4">
          <p className="text-sm text-destructive font-medium">Error en la corrección</p>
          <p className="text-xs text-muted-foreground mt-1">{state.correction.error}</p>
        </div>
      )}

      {/* Pass 1: Correction results */}
      {correctionResult && (
        <div className="space-y-6" aria-live="polite">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">Nivel detectado:</span>
            <span className="font-medium">{correctionResult.level_assessment.detected_level}</span>
            {correctionResult.level_assessment.gap_notes && (
              <span className="text-muted-foreground">— {correctionResult.level_assessment.gap_notes}</span>
            )}
          </div>

          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Texto corregido</p>
            <p className="text-sm leading-relaxed">{correctionResult.corrected}</p>
          </div>

          {correctionResult.errors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(correctionResult.errors.map((e) => e.type))).map((type) => {
                const colorClass = ERROR_COLORS_MAP[type] ?? 'bg-gray-100'
                const bg = colorClass.split(' ')[0]
                return (
                  <span key={type} className={`text-xs px-2 py-0.5 rounded-full ${bg}`}>
                    {ERROR_TYPE_LABELS[type] ?? type}
                  </span>
                )
              })}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Original con errores</p>
              <div className="rounded-lg border p-4">
                <ErrorHighlight
                  text={text}
                  errors={correctionResult.errors}
                  activeErrorIdx={activeErrorIdx}
                  onErrorClick={setActiveErrorIdx}
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Errores ({correctionResult.summary.error_count})
              </p>
              <ErrorPanel
                errors={correctionResult.errors}
                activeIdx={activeErrorIdx}
                onSelect={setActiveErrorIdx}
              />
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <TipsList tips={correctionResult.tips} mainFocus={correctionResult.summary.main_focus} />
          </div>
        </div>
      )}

      {/* Pass 2: Vocabulary */}
      {(state.vocabulary.status === 'running' || vocabResult) && (
        <div className="rounded-lg border p-4 space-y-4">
          {state.vocabulary.status === 'running' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" /> Analizando vocabulario...
            </div>
          )}
          {vocabResult && <VocabularyPanel cards={vocabResult.vocab_cards} />}
        </div>
      )}

      {/* Pass 3: Exercises */}
      {(state.exercises.status === 'running' || exercisesResult) && (
        <div className="rounded-lg border p-4 space-y-4">
          {state.exercises.status === 'running' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" /> Generando ejercicios...
            </div>
          )}
          {exercisesResult && (
            <ExercisesPanel
              exercises={exercisesResult.exercises}
              studyAdvice={exercisesResult.study_advice}
            />
          )}
        </div>
      )}
    </div>
  )
}
