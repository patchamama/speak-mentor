import { cn } from '@/lib/utils'
import { Button } from '@/shared/ui/Button'
import type { Session } from '@/shared/types'

interface SessionListProps {
  sessions: Session[]
  selectedId: number | null
  onSelect: (id: number) => void
  onDelete: (id: number) => void
  deleting: boolean
}

const MODE_LABEL: Record<string, string> = { correction: 'Corrección', translation: 'Traducción' }
const MODE_COLOR: Record<string, string> = {
  correction: 'bg-blue-100 text-blue-700',
  translation: 'bg-green-100 text-green-700',
}

export function SessionList({ sessions, selectedId, onSelect, onDelete, deleting }: SessionListProps) {
  if (sessions.length === 0) {
    return <p className="text-sm text-muted-foreground italic p-4">Sin sesiones guardadas.</p>
  }

  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <div
          key={s.id}
          className={cn(
            'rounded-lg border p-3 cursor-pointer transition-all',
            selectedId === s.id ? 'border-primary shadow-sm' : 'border-border hover:border-muted-foreground'
          )}
          onClick={() => onSelect(s.id!)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', MODE_COLOR[s.mode])}>
                  {MODE_LABEL[s.mode]}
                </span>
                <span className="text-xs bg-muted px-2 py-0.5 rounded">{s.level}</span>
                <span className="text-xs text-muted-foreground">
                  {s.created_at ? new Date(s.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
              <p className="text-sm truncate text-muted-foreground">{s.input_text}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onDelete(s.id!) }}
              disabled={deleting}
              className="shrink-0 text-destructive hover:text-destructive"
              aria-label="Eliminar sesión"
            >
              ✕
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
