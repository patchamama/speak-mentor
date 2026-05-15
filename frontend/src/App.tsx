import { useState } from 'react'
import { Toaster } from 'sonner'
import { CorrectionContainer } from './features/correction/CorrectionContainer'
import { SettingsContainer } from './features/settings/SettingsContainer'
import { cn } from './lib/utils'

type Page = 'correction' | 'settings'

export default function App() {
  const [page, setPage] = useState<Page>('correction')

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Speak Mentor</h1>
        <nav className="flex items-center gap-1">
          {(['correction', 'settings'] as Page[]).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                page === p ? 'bg-muted font-medium' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {p === 'correction' ? 'Corrección' : 'Configuración'}
            </button>
          ))}
        </nav>
        <span className="text-xs text-muted-foreground">v0.1.0</span>
      </header>
      <main className="container mx-auto px-6 py-8 max-w-5xl">
        {page === 'correction' && <CorrectionContainer />}
        {page === 'settings' && <SettingsContainer />}
      </main>
      <Toaster />
    </div>
  )
}
