import { useState } from 'react'
import { Spinner } from '@/shared/ui/Spinner'
import { Button } from '@/shared/ui/Button'
import { SessionList } from './components/SessionList'
import { ByTypeChart, ByLevelChart, TimelineChart, TopRulesTable } from './components/ErrorStatsChart'
import { ErrorHighlight, ERROR_COLORS_MAP } from '@/features/correction/components/ErrorHighlight'
import { ErrorPanel } from '@/features/correction/components/ErrorPanel'
import { TipsList } from '@/features/correction/components/TipsList'
import {
  useSessionList, useSessionDetail, useDeleteSession,
  useStatsByType, useStatsByLevel, useStatsTimeline, useTopRules,
} from './hooks/useHistory'
import type { CorrectionResponse } from '@/shared/ollama/schemas'

function StatsPanel() {
  const { data: byType, isError: byTypeErr, isLoading: byTypeLoading } = useStatsByType()
  const { data: byLevel, isError: byLevelErr, isLoading: byLevelLoading } = useStatsByLevel()
  const { data: timeline, isError: timelineErr, isLoading: timelineLoading } = useStatsTimeline()
  const { data: topRules, isError: topRulesErr, isLoading: topRulesLoading } = useTopRules()

  const anyError = byTypeErr || byLevelErr || timelineErr || topRulesErr
  const anyLoading = byTypeLoading || byLevelLoading || timelineLoading || topRulesLoading

  if (anyLoading) {
    return <div className="flex justify-center p-12"><Spinner /></div>
  }

  if (anyError) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 space-y-2">
        <p className="text-sm font-medium text-destructive">No se puede conectar con el backend</p>
        <p className="text-xs text-muted-foreground">
          Asegurate de que el servidor Flask esté corriendo en <code className="bg-muted px-1 rounded">localhost:5001</code>.
        </p>
        <pre className="text-xs text-muted-foreground mt-2">cd backend && flask --app wsgi:app run --port 5001</pre>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border p-4 space-y-3">
          <p className="text-sm font-medium">Errores por tipo (top 10)</p>
          {byType && byType.length > 0 ? <ByTypeChart data={byType.slice(0, 10)} /> : <p className="text-sm text-muted-foreground italic">Sin datos aún — guardá una sesión de corrección.</p>}
        </div>
        <div className="rounded-lg border p-4 space-y-3">
          <p className="text-sm font-medium">Errores por nivel</p>
          {byLevel && byLevel.length > 0 ? <ByLevelChart data={byLevel} /> : <p className="text-sm text-muted-foreground italic">Sin datos aún.</p>}
        </div>
      </div>
      <div className="rounded-lg border p-4 space-y-3">
        <p className="text-sm font-medium">Errores por día (últimos 30 días)</p>
        {timeline && timeline.length > 0 ? <TimelineChart data={timeline} /> : <p className="text-sm text-muted-foreground italic">Sin datos aún.</p>}
      </div>
      <div className="rounded-lg border p-4 space-y-3">
        <p className="text-sm font-medium">Reglas más incumplidas (top 10)</p>
        <TopRulesTable data={topRules ?? []} />
      </div>
    </div>
  )
}

const MODE_FILTER_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'correction', label: 'Corrección' },
  { value: 'translation', label: 'Traducción' },
]


interface HistoryViewProps {
  initialTab?: 'sessions' | 'stats'
}

export function HistoryView({ initialTab = 'sessions' }: HistoryViewProps) {
  const [tab, setTab] = useState<'sessions' | 'stats'>(initialTab)
  const [page, setPage] = useState(1)
  const [modeFilter, setModeFilter] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [activeErrorIdx, setActiveErrorIdx] = useState<number | null>(null)

  const { data, isLoading } = useSessionList(page, modeFilter || undefined)
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
        <h2 className="text-lg font-semibold">Historial</h2>
        <div className="flex gap-1">
          {(['sessions', 'stats'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${tab === t ? 'bg-muted font-medium' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t === 'sessions' ? 'Sesiones' : 'Estadísticas'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'sessions' && (
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
                  {opt.label}
                </button>
              ))}
              <Button variant="outline" size="sm" onClick={handleExport} className="ml-auto">
                Exportar JSON
              </Button>
            </div>

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
              <p className="text-sm text-muted-foreground italic">Seleccioná una sesión para ver el detalle.</p>
            )}
            {detailLoading && <div className="flex justify-center p-8"><Spinner /></div>}
            {detail && !detailLoading && (() => {
              // Parse raw_llm and merge position_unreliable from persisted errors
              // (raw_llm is the model's JSON output; position_unreliable is added by
              // client.ts post-processing and stored separately in the errors table)
              const correctionData: CorrectionResponse | null = (() => {
                if (detail.mode !== 'correction' || !detail.raw_llm) return null
                try {
                  const parsed: CorrectionResponse = JSON.parse(detail.raw_llm)
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

              return (
                <div className="space-y-4">
                  {correctionData ? (
                    <>
                      {/* Level assessment */}
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">Nivel detectado:</span>
                        <span className="font-medium">{correctionData.level_assessment.detected_level}</span>
                        {correctionData.level_assessment.gap_notes && (
                          <span className="text-muted-foreground">— {correctionData.level_assessment.gap_notes}</span>
                        )}
                      </div>

                      {/* Corrected text */}
                      <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Texto corregido</p>
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
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Original con errores</p>
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
                            Errores ({correctionData.summary.error_count})
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
                  ) : (
                    <>
                      <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Texto original</p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{detail.input_text}</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-4 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Traducción</p>
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

      {tab === 'stats' && (
        <StatsPanel />
      )}
    </div>
  )
}
