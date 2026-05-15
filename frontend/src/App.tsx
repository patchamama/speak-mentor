import { useState } from 'react'
import { Toaster } from 'sonner'
import { SettingsContainer } from './features/settings/SettingsContainer'

type Page = 'settings'

export default function App() {
  const [page, setPage] = useState<Page>('settings')

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Speak Mentor</h1>
        <nav className="flex items-center gap-4">
          <button
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setPage('settings')}
          >
            Configuración
          </button>
        </nav>
        <span className="text-xs text-muted-foreground">v0.1.0</span>
      </header>
      <main className="container mx-auto px-6 py-8">
        {page === 'settings' && <SettingsContainer />}
      </main>
      <Toaster />
    </div>
  )
}
