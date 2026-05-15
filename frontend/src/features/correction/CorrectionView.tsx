import { useState, useCallback } from 'react'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'
import { LevelSelector } from '@/shared/ui/LevelSelector'
import { ErrorHighlight, ERROR_COLORS_MAP } from './components/ErrorHighlight'
import { ErrorPanel } from './components/ErrorPanel'
import { TipsList } from './components/TipsList'
import type { CEFRLevel } from '@/shared/types'
import type { CorrectionResponse } from '@/shared/ollama/schemas'

interface CorrectionViewProps {
  result: CorrectionResponse | null
  rawError: string | null
  loading: boolean
  saving: boolean
  savedSessionId: number | null
  onCorrect: (text: string, level: CEFRLevel) => void
  onSave: (text: string, level: CEFRLevel) => void
}

const ERROR_TYPE_LABELS: Record<string, string> = {
  gender: 'Género', case: 'Caso', declension: 'Declinación',
  conjugation: 'Conjugación', preposition: 'Preposición', word_order: 'Orden',
  spelling: 'Ortografía', punctuation: 'Puntuación', vocabulary: 'Vocabulario',
  style: 'Estilo', agreement: 'Concordancia', tense: 'Tiempo', mood: 'Modo',
  voice: 'Voz', particle: 'Partícula',
}

export function CorrectionView({
  result, rawError, loading, saving, savedSessionId, onCorrect, onSave,
}: CorrectionViewProps) {
  const [text, setText] = useState('')
  const [level, setLevel] = useState<CEFRLevel>('B1')
  const [activeErrorIdx, setActiveErrorIdx] = useState<number | null>(null)

  const handleSubmit = useCallback(() => {
    if (!text.trim()) return
    setActiveErrorIdx(null)
    onCorrect(text, level)
  }, [text, level, onCorrect])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit()
  }, [handleSubmit])

  const handleSave = useCallback(() => onSave(text, level), [text, level, onSave])

  return (
    <div className="space-y-6">
      {/* Input area */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-semibold">Corrección</h2>
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
        <div className="flex items-center gap-3">
          <Button onClick={handleSubmit} disabled={loading || !text.trim()} aria-busy={loading}>
            {loading ? <><Spinner className="mr-2" />Corrigiendo...</> : 'Corregir'}
          </Button>
          {result && !savedSessionId && (
            <Button variant="outline" onClick={handleSave} disabled={saving}>
              {saving ? <><Spinner className="mr-2" />Guardando...</> : 'Guardar'}
            </Button>
          )}
          {savedSessionId && (
            <span className="text-sm text-muted-foreground">✓ Guardado (#{savedSessionId})</span>
          )}
          <span className="ml-auto text-xs text-muted-foreground">{text.length}/2000</span>
        </div>
      </div>

      {/* Raw error fallback */}
      {rawError && (
        <div className="rounded-md border border-destructive p-4 space-y-2">
          <p className="text-sm text-destructive font-medium">El modelo devolvió JSON inválido</p>
          <pre className="text-xs text-muted-foreground overflow-auto max-h-40 whitespace-pre-wrap">{rawError}</pre>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6" aria-live="polite" aria-label="Resultados de corrección">
          {/* Level assessment */}
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">Nivel detectado:</span>
            <span className="font-medium">{result.level_assessment.detected_level}</span>
            {result.level_assessment.gap_notes && (
              <span className="text-muted-foreground">— {result.level_assessment.gap_notes}</span>
            )}
          </div>

          {/* Corrected text */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Texto corregido</p>
            <p className="text-sm leading-relaxed">{result.corrected}</p>
          </div>

          {/* Color legend */}
          {result.errors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(result.errors.map((e) => e.type))).map((type) => {
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

          {/* Inline highlighted + side panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Original con errores</p>
              <div className="rounded-lg border p-4">
                <ErrorHighlight
                  text={text}
                  errors={result.errors}
                  activeErrorIdx={activeErrorIdx}
                  onErrorClick={setActiveErrorIdx}
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Errores ({result.summary.error_count})
              </p>
              <ErrorPanel
                errors={result.errors}
                activeIdx={activeErrorIdx}
                onSelect={setActiveErrorIdx}
              />
            </div>
          </div>

          {/* Tips */}
          <div className="rounded-lg border p-4">
            <TipsList tips={result.tips} mainFocus={result.summary.main_focus} />
          </div>
        </div>
      )}
    </div>
  )
}
