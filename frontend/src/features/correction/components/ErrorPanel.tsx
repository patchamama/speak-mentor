import { useSettingsStore } from '@/stores/settingsStore'
import type { CorrectionView } from '@/stores/correctionViewStore'
import type { CEFRLevel } from '@/shared/types'
import { errorTypeLabel, isGrammarError } from '../errorTypes'
import { GrammarExplanationButton } from '../grammar/GrammarExplanationButton'
import { msg, t } from '@/i18n'
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
  critical: msg('Crítico'),
  major: msg('Mayor'),
  minor: msg('Menor'),
}

interface ErrorPanelProps {
  errors: CorrectionResponse['errors']
  activeIdx: number | null
  onSelect: (idx: number) => void
  /** `cards` fills the available width; `detailed` is a single column list. */
  layout?: CorrectionView
  /** Learner level for grammar explanations. */
  level?: CEFRLevel
}

export function ErrorPanel({ errors, activeIdx, onSelect, layout = 'detailed', level }: ErrorPanelProps) {
  const lastLevel = useSettingsStore((s) => s.lastCorrectionLevel)
  const cards = layout === 'cards'

  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (activeIdx !== null) {
      itemRefs.current[activeIdx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activeIdx])

  if (errors.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic p-4">
        {t('Sin errores encontrados.')}
      </div>
    )
  }

  return (
    <div
      data-testid="error-list"
      className={cards ? 'grid items-stretch gap-3 grid-cols-[repeat(auto-fill,minmax(min(17rem,100%),1fr))]' : 'space-y-3'}
    >
      {errors.map((err, idx) => {
        const colorClass = ERROR_COLORS_MAP[err.type] ?? 'bg-gray-100'
        const badgeColor = colorClass.split(' ')[0]
        return (
          <div
            key={idx}
            ref={(el) => { itemRefs.current[idx] = el }}
            className={cn(
              'rounded-lg border p-3 cursor-pointer transition-all text-sm flex flex-col',
              activeIdx === idx ? 'border-primary shadow-sm' : 'border-border hover:border-muted-foreground'
            )}
            onClick={() => onSelect(idx)}
          >
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', badgeColor)}>
                {errorTypeLabel(err.type)}
              </span>
              <span className={cn('text-xs px-2 py-0.5 rounded-full', SEVERITY_BADGE[err.severity])}>
                {t(SEVERITY_LABEL[err.severity])}
              </span>
              {(err as { position_unreliable?: boolean }).position_unreliable && (
                <span className="text-xs text-muted-foreground">{t('(sin posición)')}</span>
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
            {isGrammarError(err.type) && (
              <div className="mt-auto pt-2">
                <GrammarExplanationButton error={err} level={level ?? lastLevel} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
