import { Toaster } from 'sonner'

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Speak Mentor</h1>
        <span className="text-xs text-muted-foreground">v0.1.0</span>
      </header>
      <main className="container mx-auto px-6 py-8">
        <p className="text-muted-foreground">Configurando...</p>
      </main>
      <Toaster />
    </div>
  )
}
