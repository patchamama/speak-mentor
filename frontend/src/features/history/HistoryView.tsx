import { useState } from 'react'
import { Spinner } from '@/shared/ui/Spinner'
import { Button } from '@/shared/ui/Button'
import { SessionList } from './components/SessionList'
import { ByTypeChart, ByLevelChart, TimelineChart, TopRulesTable } from './components/ErrorStatsChart'
import {
  useSessionList, useSessionDetail, useDeleteSession,
  useStatsByType, useStatsByLevel, useStatsTimeline, useTopRules,
} from './hooks/useHistory'

const MODE_FILTER_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'correction', label: 'Corrección' },
  { value: 'translation', label: 'Traducción' },
]

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  major: 'bg-orange-100 text-orange-700',
  minor: 'bg-gray-100 text-gray-600',
}

export function HistoryView() {
  const [tab, setTab] = useState<'sessions' | 'stats'>('sessions')
  const [page, setPage] = useState(1)
  const [modeFilter, setModeFilter] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const { data, isLoading } = useSessionList(page, modeFilter || undefined)
  const { data: detail, isLoading: detailLoading } = useSessionDetail(selectedId)
  const { mutate: deleteSession, isPending: deleting } = useDeleteSession()

  const { data: byType } = useStatsByType()
  const { data: byLevel } = useStatsByLevel()
  const { data: timeline } = useStatsTimeline()
  const { data: topRules } = useTopRules()

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
                onSelect={setSelectedId}
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
            {detail && !detailLoading && (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Texto original</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{detail.input_text}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {detail.mode === 'correction' ? 'Texto corregido' : 'Traducción'}
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{detail.output_text}</p>
                </div>
                {detail.errors && detail.errors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Errores ({detail.errors.length})
                    </p>
                    {detail.errors.map((err, i) => (
                      <div key={i} className="rounded-md border p-3 text-sm space-y-1">
                        <div className="flex gap-2 items-center">
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">{err.type}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${SEVERITY_BADGE[err.severity]}`}>{err.severity}</span>
                        </div>
                        <p><span className="line-through text-muted-foreground">{err.original}</span> → <span className="font-medium">{err.correction}</span></p>
                        <p className="text-xs text-muted-foreground">{err.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'stats' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-sm font-medium">Errores por tipo (top 10)</p>
              {byType && byType.length > 0 ? <ByTypeChart data={byType.slice(0, 10)} /> : <p className="text-sm text-muted-foreground italic">Sin datos.</p>}
            </div>
            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-sm font-medium">Errores por nivel</p>
              {byLevel && byLevel.length > 0 ? <ByLevelChart data={byLevel} /> : <p className="text-sm text-muted-foreground italic">Sin datos.</p>}
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-sm font-medium">Errores por día (últimos 30 días)</p>
            {timeline && timeline.length > 0 ? <TimelineChart data={timeline} /> : <p className="text-sm text-muted-foreground italic">Sin datos.</p>}
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-sm font-medium">Reglas más incumplidas (top 10)</p>
            <TopRulesTable data={topRules ?? []} />
          </div>
        </div>
      )}
    </div>
  )
}
