import { useState } from 'react'
import { Toaster } from 'sonner'
import { CorrectionContainer } from './features/correction/CorrectionContainer'
import { TranslationContainer } from './features/translation/TranslationContainer'
import { HistoryContainer } from './features/history/HistoryContainer'
import { SettingsContainer } from './features/settings/SettingsContainer'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useThemeStore } from './stores/themeStore'
import { cn } from './lib/utils'

type Page = 'correction' | 'translation' | 'history' | 'settings'

const PAGE_LABELS: Record<Page, string> = {
  correction: 'Corrección',
  translation: 'Traducción',
  history: 'Historial',
  settings: 'Configuración',
}

export default function App() {
  const [page, setPage] = useState<Page>('correction')
  const { dark, toggle } = useThemeStore()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Speak Mentor</h1>
        <nav className="flex items-center gap-1" role="navigation" aria-label="Navegación principal">
          {(['correction', 'translation', 'history', 'settings'] as Page[]).map((p) => (
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
          <span className="text-xs text-muted-foreground">v0.1.0</span>
        </div>
      </header>
      <main className="container mx-auto px-6 py-8 max-w-5xl">
        <ErrorBoundary>
          {page === 'correction' && <CorrectionContainer />}
          {page === 'translation' && <TranslationContainer />}
          {page === 'history' && <HistoryContainer />}
          {page === 'settings' && <SettingsContainer />}
        </ErrorBoundary>
      </main>
      <Toaster />
    </div>
  )
}
