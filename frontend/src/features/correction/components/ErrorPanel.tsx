import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { ERROR_COLORS_MAP } from './ErrorHighlight'
import type { CorrectionResponse } from '@/shared/ollama/schemas'

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border border-red-300',
  major: 'bg-orange-100 text-orange-700 border border-orange-300',
  minor: 'bg-gray-100 text-gray-600 border border-gray-300',
}

const SEVERITY_LABEL: Record<string, string> = {
  critical: 'Crítico',
  major: 'Mayor',
  minor: 'Menor',
}

interface ErrorPanelProps {
  errors: CorrectionResponse['errors']
  activeIdx: number | null
  onSelect: (idx: number) => void
}

export function ErrorPanel({ errors, activeIdx, onSelect }: ErrorPanelProps) {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (activeIdx !== null) {
      itemRefs.current[activeIdx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activeIdx])

  if (errors.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic p-4">
        Sin errores encontrados.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {errors.map((err, idx) => {
        const colorClass = ERROR_COLORS_MAP[err.type] ?? 'bg-gray-100'
        const badgeColor = colorClass.split(' ')[0]
        return (
          <div
            key={idx}
            ref={(el) => { itemRefs.current[idx] = el }}
            className={cn(
              'rounded-lg border p-3 cursor-pointer transition-all text-sm',
              activeIdx === idx ? 'border-primary shadow-sm' : 'border-border hover:border-muted-foreground'
            )}
            onClick={() => onSelect(idx)}
          >
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', badgeColor)}>
                {err.type}
              </span>
              <span className={cn('text-xs px-2 py-0.5 rounded-full', SEVERITY_BADGE[err.severity])}>
                {SEVERITY_LABEL[err.severity]}
              </span>
              {(err as { position_unreliable?: boolean }).position_unreliable && (
                <span className="text-xs text-muted-foreground">(sin posición)</span>
              )}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="line-through text-muted-foreground">{err.original}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-medium text-foreground">{err.correction}</span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">{err.explanation}</p>
            {err.rule_reference && (
              <p className="text-xs text-primary mt-1 font-medium">{err.rule_reference}</p>
            )}
            {err.example && (
              <p className="text-xs text-muted-foreground mt-1 italic">"{err.example}"</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
