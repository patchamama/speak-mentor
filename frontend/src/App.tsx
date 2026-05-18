import { useState } from 'react'
import { Toaster } from 'sonner'
import { CorrectionContainer } from './features/correction/CorrectionContainer'
import { TranslationContainer } from './features/translation/TranslationContainer'
import { HistoryContainer } from './features/history/HistoryContainer'
import { SettingsContainer } from './features/settings/SettingsContainer'
import { CommonErrorsView } from './features/common-errors/CommonErrorsView'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useThemeStore } from './stores/themeStore'
import { useFaviconRenderer } from './shared/hooks/useFaviconProgress'
import { useOllamaStartup, type OllamaStatus } from './shared/hooks/useOllamaStartup'
import { useBackendStatus } from './shared/hooks/useBackendStatus'
import { useBackendStore } from './stores/backendStore'
import { useOllamaActivityStore } from './stores/ollamaActivityStore'
import { cn } from './lib/utils'

const STATUS_DOT: Record<OllamaStatus, { color: string; label: string }> = {
  idle:      { color: 'bg-muted-foreground/40', label: 'Ollama: pendiente' },
  checking:  { color: 'bg-yellow-400 animate-pulse', label: 'Ollama: conectando…' },
  connected: { color: 'bg-green-500', label: 'Ollama: conectado' },
  error:     { color: 'bg-red-500', label: 'Ollama: sin conexión' },
}

type Page = 'correction' | 'translation' | 'common-errors' | 'stats' | 'settings'

const PAGE_LABELS: Record<Page, string> = {
  correction: 'Corrección',
  translation: 'Traducción',
  'common-errors': 'Errores frecuentes',
  stats: 'Estadísticas',
  settings: 'Configuración',
}

export default function App() {
  const [page, setPage] = useState<Page>('correction')
  const { dark, toggle } = useThemeStore()
  useFaviconRenderer()
  const { ollamaStatus } = useOllamaStartup()
  useBackendStatus()
  const backendStatus = useBackendStore((s) => s.status)
  const ollamaBusy = useOllamaActivityStore((s) => s.busy)
  const dot = ollamaBusy && ollamaStatus === 'connected'
    ? { color: 'bg-green-400 animate-pulse', label: 'Ollama: procesando…' }
    : STATUS_DOT[ollamaStatus]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Speak Mentor</h1>
        <nav className="flex items-center gap-1" role="navigation" aria-label="Navegación principal">
          {(['correction', 'translation', 'common-errors', 'stats', 'settings'] as Page[]).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              aria-current={page === p ? 'page' : undefined}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                page === p ? 'bg-muted font-medium' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {PAGE_LABELS[p]}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted"
          >
            {dark ? '☀' : '☾'}
          </button>
          <span
            title={dot.label}
            aria-label={dot.label}
            className={cn('h-2 w-2 rounded-full inline-block', dot.color)}
          />
          <span
            title={`Backend: ${backendStatus}`}
            aria-label={`Backend: ${backendStatus}`}
            className={cn('h-2 w-2 rounded-full inline-block', {
              'bg-muted-foreground/40 animate-pulse': backendStatus === 'checking',
              'bg-green-500': backendStatus === 'available',
              'bg-red-400': backendStatus === 'unavailable',
            })}
          />
          <span className="text-xs text-muted-foreground">v0.1.0</span>
        </div>
      </header>
      <main className="container mx-auto px-6 py-8 max-w-5xl">
        <ErrorBoundary>
          <div hidden={page !== 'correction'}><CorrectionContainer /></div>
          <div hidden={page !== 'translation'}><TranslationContainer /></div>
          <div hidden={page !== 'stats'}><HistoryContainer /></div>
          <div hidden={page !== 'common-errors'}><CommonErrorsView /></div>
          <div hidden={page !== 'settings'}><SettingsContainer /></div>
        </ErrorBoundary>
      </main>
      <Toaster />
    </div>
  )
}
