import { t } from '@/i18n'
import { Button } from '@/shared/ui/Button'
import { errorTypeLabel } from '../errorTypes'

interface PracticeLinksProps<E extends { type: string }> {
  errors: E[]
  onPractice: (errors: E[]) => void
  busy: boolean
  failure?: string | null
}

/** One practice shortcut per detected problem. */
export function PracticeLinks<E extends { type: string }>({
  errors,
  onPractice,
  busy,
  failure,
}: PracticeLinksProps<E>) {
  if (errors.length === 0) return null
  const types = Array.from(new Set(errors.map((e) => e.type)))

  return (
    <nav aria-label={t('Practicar más')} className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3 space-y-2">
      <p className="text-sm font-medium">🎯 {t('Practicar más con ejercicios sobre:')}</p>
      <div className="flex flex-wrap gap-2">
        {types.map((type) => {
          const ofType = errors.filter((e) => e.type === type)
          return (
            <Button key={type} type="button" size="sm" variant="outline" disabled={busy} onClick={() => onPractice(ofType)}>
              {errorTypeLabel(type)} ({ofType.length}) →
            </Button>
          )
        })}
        {types.length > 1 && (
          <Button type="button" size="sm" disabled={busy} onClick={() => onPractice(errors)}>
            {t('Todos los problemas')} →
          </Button>
        )}
      </div>
      {failure && <p role="alert" className="text-xs text-destructive">{failure}</p>}
    </nav>
  )
}
