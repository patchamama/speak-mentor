import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface InputHistoryProps {
  history: string[]
  onSelect: (entry: string) => void
  onRemove: (entry: string) => void
}

export function InputHistory({ history, onSelect, onRemove }: InputHistoryProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (history.length === 0) return null

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-input transition-colors',
          'text-muted-foreground hover:text-foreground hover:bg-muted',
          open && 'bg-muted text-foreground'
        )}
        aria-label="Historial de entradas"
        aria-expanded={open}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M12 7v5l4 2" />
        </svg>
        Historial ({history.length})
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-80 rounded-md border bg-popover shadow-md">
          <div className="p-1">
            {history.map((entry, i) => (
              <div
                key={i}
                className="group flex items-start gap-2 rounded-sm px-2 py-1.5 hover:bg-muted cursor-pointer"
                onClick={() => { onSelect(entry); setOpen(false) }}
              >
                <span className="flex-1 text-xs leading-relaxed line-clamp-2 text-foreground">
                  {entry}
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRemove(entry) }}
                  className="shrink-0 mt-0.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Eliminar entrada"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
