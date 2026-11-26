import { LANGUAGES, msg, t, useLanguageStore, type Language } from '@/i18n'
import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { useIsFetching } from '@tanstack/react-query'
import { CorrectionContainer } from './features/correction/CorrectionContainer'
import { TranslationContainer } from './features/translation/TranslationContainer'
import { HistoryContainer } from './features/history/HistoryContainer'
import { SettingsContainer } from './features/settings/SettingsContainer'
import { CommonErrorsView } from './features/common-errors/CommonErrorsView'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useHasStoredSecrets, useVaultOpen } from './components/secretHooks'
import { useThemeStore } from './stores/themeStore'
import { useFaviconRenderer } from './shared/hooks/useFaviconProgress'
import { useOllamaStartup, type OllamaStatus } from './shared/hooks/useOllamaStartup'
import { useBackendStatus } from './shared/hooks/useBackendStatus'
import { useBackendStore } from './stores/backendStore'
import { useOllamaActivityStore } from './stores/ollamaActivityStore'
import { useStorageTarget } from './shared/storage/useStorageTarget'
import { STORAGE_LABELS } from './shared/storage/resolve'
import { getPasswordHint } from './shared/crypto/vault'
import { cn } from './lib/utils'

const STATUS_DOT: Record<OllamaStatus, { color: string; label: string }> = {
  idle:      { color: 'bg-muted-foreground/40', label: msg('Ollama: pendiente') },
  checking:  { color: 'bg-yellow-400 animate-pulse', label: msg('Ollama: conectando…') },
  connected: { color: 'bg-green-500', label: msg('Ollama: conectado') },
  error:     { color: 'bg-red-500', label: msg('Ollama: sin conexión') },
}

type Page = 'correction' | 'translation' | 'common-errors' | 'stats' | 'settings'

const PAGE_LABELS: Record<Page, string> = {
  correction: msg('Corrección'),
  translation: msg('Traducción'),
  'common-errors': msg('Errores frecuentes'),
  stats: msg('Estadísticas'),
  settings: msg('Configuración'),
}

export default function App() {
  const [page, setPage] = useState<Page>('correction')
  const { dark, toggle } = useThemeStore()
  useFaviconRenderer()
  // Subscribing here re-renders the whole tree when the language changes.
  const { language, setLanguage } = useLanguageStore()
  useEffect(() => {
    document.documentElement.lang = language
  }, [language])
  const { ollamaStatus } = useOllamaStartup()
  useBackendStatus()
  const backendStatus = useBackendStore((s) => s.status)
  const ollamaBusy = useOllamaActivityStore((s) => s.busy)
  const backendFetching = useIsFetching() > 0
  const storage = useStorageTarget()
  const hasSecrets = useHasStoredSecrets()
  const vaultOpen = useVaultOpen()
  const passwordHint = getPasswordHint()
  const [connectionRequest, setConnectionRequest] = useState(0)
  const openConnectionSettings = () => {
    setPage('settings')
    setConnectionRequest((n) => n + 1)
  }

  const ollamaDot = ollamaBusy && ollamaStatus === 'connected'
    ? { color: 'bg-green-400 animate-pulse', label: msg('Ollama: procesando…') }
    : STATUS_DOT[ollamaStatus]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Speak Mentor</h1>
        <nav className="flex items-center gap-1" role="navigation" aria-label={t('Navegación principal')}>
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
              {t(PAGE_LABELS[p])}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <select
            aria-label="Idioma / Sprache"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="text-xs rounded-md border border-input bg-background px-1.5 py-1"
          >
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <button
            onClick={toggle}
            aria-label={dark ? t('Activar modo claro') : t('Activar modo oscuro')}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted"
          >
            {dark ? '☀' : '☾'}
          </button>
          <span
            title={backendFetching ? t('Backend: consultando…') : `Backend: ${backendStatus}`}
            aria-label={backendFetching ? t('Backend: consultando…') : `Backend: ${backendStatus}`}
            className={cn('h-2 w-2 rounded-full inline-block', {
              'bg-muted-foreground/40 animate-pulse': backendStatus === 'checking',
              'bg-green-400 animate-pulse': backendStatus === 'available' && backendFetching,
              'bg-green-500': backendStatus === 'available' && !backendFetching,
              'bg-red-500': backendStatus === 'unavailable',
            })}
          />
          <span
            title={t(ollamaDot.label)}
            aria-label={t(ollamaDot.label)}
            className={cn('h-2 w-2 rounded-full inline-block', ollamaDot.color)}
          />
          {hasSecrets && !vaultOpen && (
            <button
              type="button"
              onClick={openConnectionSettings}
              className="text-xs rounded-md border border-primary/40 px-2 py-1 hover:bg-muted"
            >
              🔒 {t('Desbloquear claves')}{passwordHint ? ` (…${passwordHint})` : ''}
            </button>
          )}
          <span className="text-xs text-muted-foreground">
            {t('Datos: {target}', { target: t(STORAGE_LABELS[storage.target]) })}{storage.locked ? ' 🔒' : ''}
          </span>
          <span className="text-xs text-muted-foreground">v{__APP_VERSION__}</span>
        </div>
      </header>
      <main className="container mx-auto px-6 py-8 max-w-5xl">
        <ErrorBoundary>
          <div hidden={page !== 'correction'}><CorrectionContainer /></div>
          <div hidden={page !== 'translation'}><TranslationContainer /></div>
          <div hidden={page !== 'stats'}><HistoryContainer onUnlock={openConnectionSettings} /></div>
          <div hidden={page !== 'common-errors'}><CommonErrorsView /></div>
          <div hidden={page !== 'settings'}><SettingsContainer connectionRequest={connectionRequest} /></div>
        </ErrorBoundary>
      </main>
      <Toaster />
    </div>
  )
}
