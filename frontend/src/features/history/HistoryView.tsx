import { msg, t } from '@/i18n'
import { useState } from 'react'
import { Spinner } from '@/shared/ui/Spinner'
import { Button } from '@/shared/ui/Button'
import { STORAGE_LABELS } from '@/shared/storage/resolve'
import { useStorageTarget } from '@/shared/storage/useStorageTarget'
import { LockedHistory } from './components/LockedHistory'
import { SessionList } from './components/SessionList'
import { ByTypeChart, ByLevelChart, TimelineChart, TopRulesTable } from './components/ErrorStatsChart'
import { ErrorHighlight, ERROR_COLORS_MAP } from '@/features/correction/components/ErrorHighlight'
import { ErrorPanel } from '@/features/correction/components/ErrorPanel'
import { TipsList } from '@/features/correction/components/TipsList'
import { VocabularyPanel } from '@/features/correction/components/VocabularyPanel'
import { ExercisesPanel } from '@/features/correction/components/ExercisesPanel'
import {
  useSessionList, useSessionDetail, useDeleteSession,
  useStatsByType, useStatsByLevel, useStatsTimeline, useTopRules,
} from './hooks/useHistory'
import type { CorrectionResponse } from '@/shared/ollama/schemas'
import type { VocabularyResult, ExercisesResult } from '@/features/correction/hooks/useCorrectionPipeline'

function StatsPanel() {
  const { data: byType, isError: byTypeErr, error: byTypeError, isLoading: byTypeLoading } = useStatsByType()
  const { data: byLevel, isError: byLevelErr, error: byLevelError, isLoading: byLevelLoading } = useStatsByLevel()
  const { data: timeline, isError: timelineErr, error: timelineError, isLoading: timelineLoading } = useStatsTimeline()
  const { data: topRules, isError: topRulesErr, error: topRulesError, isLoading: topRulesLoading } = useTopRules()

  const anyError = byTypeErr || byLevelErr || timelineErr || topRulesErr
  const error = byTypeError ?? byLevelError ?? timelineError ?? topRulesError
  const anyLoading = byTypeLoading || byLevelLoading || timelineLoading || topRulesLoading

  if (anyLoading) {
    return <div className="flex justify-center p-12"><Spinner /></div>
  }

  if (anyError) {
    return (
      <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 space-y-2">
        <p className="text-sm font-medium text-destructive">{t('No se pudo cargar el historial')}</p>
        <p className="text-xs text-muted-foreground">{error?.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border p-4 space-y-3">
          <p className="text-sm font-medium">{t('Errores por tipo (top 10)')}</p>
          {byType && byType.length > 0 ? <ByTypeChart data={byType.slice(0, 10)} /> : <p className="text-sm text-muted-foreground italic">{t('Sin datos aún: guarda una sesión de corrección.')}</p>}
        </div>
        <div className="rounded-lg border p-4 space-y-3">
          <p className="text-sm font-medium">{t('Errores por nivel')}</p>
          {byLevel && byLevel.length > 0 ? <ByLevelChart data={byLevel} /> : <p className="text-sm text-muted-foreground italic">{t('Sin datos aún.')}</p>}
        </div>
      </div>
      <div className="rounded-lg border p-4 space-y-3">
        <p className="text-sm font-medium">{t('Errores por día (últimos 30 días)')}</p>
        {timeline && timeline.length > 0 ? <TimelineChart data={timeline} /> : <p className="text-sm text-muted-foreground italic">{t('Sin datos aún.')}</p>}
      </div>
      <div className="rounded-lg border p-4 space-y-3">
        <p className="text-sm font-medium">{t('Reglas más incumplidas (top 10)')}</p>
        <TopRulesTable data={topRules ?? []} />
      </div>
    </div>
  )
}

const MODE_FILTER_OPTIONS = [
  { value: '', label: msg('Todos') },
  { value: 'correction', label: msg('Corrección') },
  { value: 'translation', label: msg('Traducción') },
]


interface HistoryViewProps {
  initialTab?: 'sessions' | 'stats'
  onUnlock?: () => void
}

export function HistoryView({ initialTab = 'sessions', onUnlock }: HistoryViewProps) {
  const [tab, setTab] = useState<'sessions' | 'stats'>(initialTab)
  const [page, setPage] = useState(1)
  const [modeFilter, setModeFilter] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [activeErrorIdx, setActiveErrorIdx] = useState<number | null>(null)

  const { target, locked } = useStorageTarget()
  const { data, isLoading, error: listError } = useSessionList(page, modeFilter || undefined)
  const { data: detail, isLoading: detailLoading } = useSessionDetail(selectedId)
  const { mutate: deleteSession, isPending: deleting } = useDeleteSession()

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data?.sessions ?? [], null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `speak-mentor-history-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t('Historial')}</h2>
          <p className="text-xs text-muted-foreground">{t('Datos guardados en: {target}', { target: t(STORAGE_LABELS[target]) })}</p>
        </div>
        <div className="flex gap-1">
          {(['sessions', 'stats'] as const).map((id) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${tab === id ? 'bg-muted font-medium' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {id === 'sessions' ? t('Sesiones') : t('Estadísticas')}
            </button>
          ))}
        </div>
      </div>

      {locked && <LockedHistory onUnlock={onUnlock} />}

      {!locked && tab === 'sessions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: list */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {MODE_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setModeFilter(opt.value); setPage(1); setSelectedId(null) }}
                  className={`text-sm px-3 py-1 rounded-md transition-colors ${modeFilter === opt.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                >
                  {t(opt.label)}
                </button>
              ))}
              <Button variant="outline" size="sm" onClick={handleExport} className="ml-auto">
                {t('Exportar JSON')}
              </Button>
            </div>

            {listError && (
              <p role="alert" className="text-sm text-destructive">{listError.message}</p>
            )}

            {isLoading ? (
              <div className="flex justify-center p-8"><Spinner /></div>
            ) : (
              <SessionList
                sessions={data?.sessions ?? []}
                selectedId={selectedId}
                onSelect={(id) => { setSelectedId(id); setActiveErrorIdx(null) }}
                onDelete={(id) => { deleteSession(id); if (selectedId === id) setSelectedId(null) }}
                deleting={deleting}
              />
            )}

            {/* Pagination */}
            {data && data.pages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  ←
                </Button>
                <span className="text-sm text-muted-foreground">{page} / {data.pages}</span>
                <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>
                  →
                </Button>
              </div>
            )}
          </div>

          {/* Right: detail */}
          <div className="space-y-4">
            {!selectedId && (
              <p className="text-sm text-muted-foreground italic">{t('Selecciona una sesión para ver el detalle.')}</p>
            )}
            {detailLoading && <div className="flex justify-center p-8"><Spinner /></div>}
            {detail && !detailLoading && (() => {
              const correctionData: CorrectionResponse | null = (() => {
                if (detail.mode !== 'correction' || !detail.raw_llm) return null
                try {
                  const raw = JSON.parse(detail.raw_llm)
                  const parsed: CorrectionResponse = raw.correction ?? raw
                  if (detail.errors && detail.errors.length > 0) {
                    parsed.errors = parsed.errors.map((err, i) => {
                      const saved = detail.errors![i]
                      if (!saved) return err
                      return saved.position_unreliable
                        ? { ...err, position: null, position_unreliable: true }
                        : err
                    })
                  }
                  return parsed
                } catch {
                  return null
                }
              })()

              const vocabularyHistory: VocabularyResult[] = (() => {
                if (!detail.raw_llm) return []
                try {
                  const raw = JSON.parse(detail.raw_llm)
                  if (raw.vocabularyHistory && Array.isArray(raw.vocabularyHistory)) return raw.vocabularyHistory
                  if (raw.vocabulary) return [raw.vocabulary]
                  return []
                } catch { return [] }
              })()

              const exercisesHistory: ExercisesResult[] = (() => {
                if (!detail.raw_llm) return []
                try {
                  const raw = JSON.parse(detail.raw_llm)
                  if (raw.exercisesHistory && Array.isArray(raw.exercisesHistory)) return raw.exercisesHistory
                  if (raw.exercises) return [raw.exercises]
                  return []
                } catch { return [] }
              })()

              return (
                <div className="space-y-4">
                  {correctionData ? (
                    <>
                      {/* Level assessment */}
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">{t('Nivel detectado:')}</span>
                        <span className="font-medium">{correctionData.level_assessment.detected_level}</span>
                        {correctionData.level_assessment.gap_notes && (
                          <span className="text-muted-foreground">— {correctionData.level_assessment.gap_notes}</span>
                        )}
                      </div>

                      {/* Corrected text */}
                      <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('Texto corregido')}</p>
                        <p className="text-sm leading-relaxed">{correctionData.corrected}</p>
                      </div>

                      {/* Color legend */}
                      {correctionData.errors.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {Array.from(new Set(correctionData.errors.map((e) => e.type))).map((type) => {
                            const colorClass = ERROR_COLORS_MAP[type] ?? 'bg-gray-100'
                            const bg = colorClass.split(' ')[0]
                            return (
                              <span key={type} className={`text-xs px-2 py-0.5 rounded-full ${bg}`}>
                                {type}
                              </span>
                            )
                          })}
                        </div>
                      )}

                      {/* Highlighted original + error panel */}
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('Original con errores')}</p>
                          <div className="rounded-lg border p-4">
                            <ErrorHighlight
                              text={detail.input_text}
                              errors={correctionData.errors}
                              activeErrorIdx={activeErrorIdx}
                              onErrorClick={setActiveErrorIdx}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {t('Errores')} ({correctionData.summary.error_count})
                          </p>
                          <ErrorPanel
                            errors={correctionData.errors}
                            activeIdx={activeErrorIdx}
                            onSelect={setActiveErrorIdx}
                          />
                        </div>
                      </div>

                      {/* Tips */}
                      <div className="rounded-lg border p-4">
                        <TipsList tips={correctionData.tips} mainFocus={correctionData.summary.main_focus} />
                      </div>
                    </>
                  ) : null}

                  {/* Vocabulary — all runs */}
                  {vocabularyHistory.length > 0 && (
                    <div className="space-y-4">
                      {vocabularyHistory.map((result, i) => (
                        <div key={i} className="rounded-lg border p-4 space-y-4">
                          {vocabularyHistory.length > 1 && (
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              {t('Vocabulario — generación {n}', { n: i + 1 })}
                            </p>
                          )}
                          <VocabularyPanel cards={result.vocab_cards} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Exercises — all runs */}
                  {exercisesHistory.length > 0 && (
                    <div className="space-y-4">
                      {exercisesHistory.map((result, i) => (
                        <div key={i} className="rounded-lg border p-4 space-y-4">
                          {exercisesHistory.length > 1 && (
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              {t('Ejercicios — generación {n}', { n: i + 1 })}
                            </p>
                          )}
                          <ExercisesPanel exercises={result.exercises} studyAdvice={result.study_advice} />
                        </div>
                      ))}
                    </div>
                  )}

                  {!correctionData && vocabularyHistory.length === 0 && exercisesHistory.length === 0 && (
                    <>
                      <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('Texto original')}</p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{detail.input_text}</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-4 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('Traducción')}</p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{detail.output_text}</p>
                      </div>
                    </>
                  )}
                  {detail.mode === 'translation' && (
                    <>
                      <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('Texto original')}</p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{detail.input_text}</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-4 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('Traducción')}</p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{detail.output_text}</p>
                      </div>
                    </>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {!locked && tab === 'stats' && (
        <StatsPanel />
      )}
    </div>
  )
}
