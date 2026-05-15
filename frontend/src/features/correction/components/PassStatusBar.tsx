import { Spinner } from '@/shared/ui/Spinner'
import { cn } from '@/lib/utils'
import type { PassState } from '../hooks/useCorrectionPipeline'
import type { CorrectionPassId } from '@/shared/types'
import { useElapsedTimer } from '@/shared/hooks/useElapsedTimer'

const PASS_LABELS: Record<CorrectionPassId, string> = {
  correction: 'Corrección',
  vocabulary: 'Vocabulario',
  exercises: 'Ejercicios',
}

function PassBadge({
  id,
  state,
}: {
  id: CorrectionPassId
  state: PassState<unknown>
}) {
  const elapsed = useElapsedTimer(state.status === 'running')

  const icon =
    state.status === 'done'
      ? '✓'
      : state.status === 'error'
        ? '✗'
        : state.status === 'running'
          ? null
          : '○'

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border transition-colors',
        state.status === 'done' && 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400',
        state.status === 'error' && 'border-destructive/40 bg-destructive/10 text-destructive',
        state.status === 'running' && 'border-primary/40 bg-primary/10 text-primary',
        state.status === 'idle' && 'border-border text-muted-foreground',
      )}
    >
      {state.status === 'running' ? <Spinner className="h-3 w-3" /> : <span>{icon}</span>}
      <span>{PASS_LABELS[id]}</span>
      {state.status === 'running' && <span className="text-xs opacity-70">{elapsed}s</span>}
      {state.status === 'done' && state.elapsedMs && (
        <span className="text-xs opacity-70">{(state.elapsedMs / 1000).toFixed(1)}s</span>
      )}
    </div>
  )
}

export function PassStatusBar({
  passes,
  states,
}: {
  passes: CorrectionPassId[]
  states: Record<string, PassState<unknown>>
}) {
  const anyActive = passes.some(
    (p) => states[p]?.status === 'running' || states[p]?.status === 'done',
  )
  if (!anyActive) return null

  return (
    <div className="flex flex-wrap items-center gap-2" aria-live="polite" aria-label="Estado del pipeline">
      {passes.map((p) => (
        <PassBadge key={p} id={p} state={states[p] ?? { status: 'idle', data: null, error: null, elapsedMs: null }} />
      ))}
    </div>
  )
}
