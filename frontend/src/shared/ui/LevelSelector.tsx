import { cn } from '@/lib/utils'
import type { CEFRLevel } from '@/shared/types'

const LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

interface LevelSelectorProps {
  value: CEFRLevel
  onChange: (level: CEFRLevel) => void
  className?: string
}

export function LevelSelector({ value, onChange, className }: LevelSelectorProps) {
  return (
    <div className={cn('flex gap-1', className)} role="group" aria-label="Nivel CEFR">
      {LEVELS.map((level) => (
        <button
          key={level}
          type="button"
          onClick={() => onChange(level)}
          aria-pressed={value === level}
          className={cn(
            'px-3 py-1.5 text-sm rounded-md font-medium transition-colors',
            value === level
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-accent'
          )}
        >
          {level}
        </button>
      ))}
    </div>
  )
}
