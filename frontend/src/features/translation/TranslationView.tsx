import { useState, useCallback } from 'react'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'
import { useElapsedTimer } from '@/shared/hooks/useElapsedTimer'
import { LevelSelector } from '@/shared/ui/LevelSelector'
import { InputHistory } from '@/shared/ui/InputHistory'
import { useInputHistory } from '@/shared/hooks/useInputHistory'
import { useSettingsStore } from '@/stores/settingsStore'
import { useBackendStore } from '@/stores/backendStore'
import { cn } from '@/lib/utils'
import type { CEFRLevel, Lang } from '@/shared/types'
import type { TranslationResponse } from '@/shared/ollama/schemas'

function renderTextAsHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((para) => `<p>${para.replace(/\n/g, '<br />')}</p>`)
    .join('')
}

interface TranslationViewProps {
  result: TranslationResponse | null
  rawError: string | null
  loading: boolean
  saving: boolean
  savedSessionId: number | null
  onTranslate: (text: string, sourceLang: Lang, targetLang: Lang, level: CEFRLevel) => void
  onSave: (text: string, sourceLang: Lang, targetLang: Lang, level: CEFRLevel) => void
}

const LANG_LABELS: Record<Lang, string> = { de: 'Alemán', es: 'Español' }
const NOTE_TYPE_LABELS: Record<string, string> = {
  false_friend: 'Falso amigo',
  idiom: 'Modismo',
  collocation: 'Colocación',
  register: 'Registro',
  cultural: 'Cultural',
  polysemy: 'Polisemia',
}

export function TranslationView({
  result, rawError, loading, saving, savedSessionId, onTranslate, onSave,
}: TranslationViewProps) {
  const { lastTranslationLevel } = useSettingsStore()
  const [text, setText] = useState('')
  const [sourceLang, setSourceLang] = useState<Lang>('de')
  const [targetLang, setTargetLang] = useState<Lang>('es')
  const [level, setLevel] = useState<CEFRLevel>(lastTranslationLevel)
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [renderedHtml, setRenderedHtml] = useState<string | null>(null)
  const { history, push, remove } = useInputHistory('speak-mentor-translation-history')
  const backendStatus = useBackendStore((s) => s.status)

  const swap = useCallback(() => {
    setSourceLang(targetLang)
    setTargetLang(sourceLang)
  }, [sourceLang, targetLang])

  const handleSubmit = useCallback(() => {
    if (!text.trim()) return
    setShowAlternatives(false)
    push(text)
    onTranslate(text, sourceLang, targetLang, level)
  }, [text, sourceLang, targetLang, level, onTranslate, push])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit()
  }, [handleSubmit])

  const handleSave = useCallback(() => onSave(text, sourceLang, targetLang, level), [text, sourceLang, targetLang, level, onSave])
  const handleRender = useCallback(() => {
    if (!text.trim()) return
    setRenderedHtml(renderTextAsHtml(text))
  }, [text])
  const elapsed = useElapsedTimer(loading)

  return (
    <div className="space-y-6">
      {/* Lang selector + level */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Traducción</h2>
          <InputHistory
            history={history}
            onSelect={(entry) => setText(entry)}
            onRemove={remove}
          />
        </div>
        <LevelSelector value={level} onChange={setLevel} />
      </div>

      {/* Source/target language selector */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {(['de', 'es'] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => { setSourceLang(l); setTargetLang(l === 'de' ? 'es' : 'de') }}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md font-medium transition-colors',
                sourceLang === l ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
              )}
            >
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={swap}
          className="text-muted-foreground hover:text-foreground transition-colors px-2"
          aria-label="Invertir idiomas"
        >
          ⇄
        </button>
        <span className="text-sm text-muted-foreground">→ {LANG_LABELS[targetLang]}</span>
      </div>

      {/* Input */}
      <div className="space-y-3">
        <textarea
          className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder={`Escribí en ${LANG_LABELS[sourceLang]}... (Cmd+Enter para traducir)`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={2000}
          aria-label={`Texto en ${LANG_LABELS[sourceLang]} para traducir`}
        />
        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={handleSubmit} disabled={loading || !text.trim()} aria-busy={loading}>
            {loading ? <><Spinner className="mr-2" />Traduciendo... {elapsed}s</> : 'Traducir'}
          </Button>
          <Button variant="outline" onClick={handleRender} disabled={!text.trim()}>
            Renderizar
          </Button>
          {result && !savedSessionId && backendStatus === 'available' && (
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

      {/* Rendered text */}
      {renderedHtml && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Texto renderizado
            </p>
            <a
              href={`https://translate.google.com/?sl=${sourceLang}&tl=${targetLang}&text=${encodeURIComponent(text)}&op=translate`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              Traducir con Google →
            </a>
          </div>
          <div
            lang={sourceLang}
            className="rounded-lg border bg-muted/20 p-4 text-sm leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </div>
      )}

      {/* Raw error */}
      {rawError && (
        <div className="rounded-md border border-destructive p-4 space-y-2">
          <p className="text-sm text-destructive font-medium">El modelo devolvió JSON inválido</p>
          <pre className="text-xs text-muted-foreground overflow-auto max-h-40 whitespace-pre-wrap">{rawError}</pre>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4" aria-live="polite" aria-label="Resultado de traducción">
          {/* Primary translation */}
          <div className="rounded-lg border bg-muted/30 p-5 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Traducción</p>
            <p className="text-base leading-relaxed">{result.translation}</p>
          </div>

          {/* Alternatives */}
          {result.alternatives && result.alternatives.length > 0 && (
            <div className="rounded-lg border p-4 space-y-3">
              <button
                type="button"
                className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
                onClick={() => setShowAlternatives(!showAlternatives)}
              >
                {showAlternatives ? '▼' : '▶'} Alternativas ({result.alternatives.length})
              </button>
              {showAlternatives && (
                <div className="space-y-2">
                  {result.alternatives.map((alt, i) => (
                    <div key={i} className="space-y-0.5">
                      <p className="text-sm">{alt.text}</p>
                      <p className="text-xs text-muted-foreground">{alt.register} — {alt.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Two column: vocab + grammar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Vocabulary notes */}
            {result.vocabulary_notes && result.vocabulary_notes.length > 0 && (
              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-sm font-medium">Vocabulario</p>
                <div className="space-y-2">
                  {result.vocabulary_notes.map((note, i) => (
                    <div key={i} className="text-sm space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{note.source_term}</span>
                        <span className="text-muted-foreground">→</span>
                        <span>{note.target_term}</span>
                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {NOTE_TYPE_LABELS[note.type] ?? note.type}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{note.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grammar notes */}
            {result.grammar_notes && result.grammar_notes.length > 0 && (
              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-sm font-medium">Gramática</p>
                <div className="space-y-2">
                  {result.grammar_notes.map((note, i) => (
                    <div key={i} className="text-sm space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{note.topic}</span>
                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{note.level_relevant}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{note.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Level adaptation note */}
          {result.level_adaptation_notes && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Adaptación al nivel</p>
              <p className="text-sm text-muted-foreground">{result.level_adaptation_notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
