import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'
import { decryptSecret, encryptSecret } from '@/shared/crypto/secret'
import { inspectRepo, type GitHubConfig } from '@/shared/storage/github'
import { STORAGE_LABELS, type StorageMode } from '@/shared/storage/resolve'
import { refreshHistory } from '@/shared/storage'
import { useStorageTarget } from '@/shared/storage/useStorageTarget'
import { useStorageStore } from '@/stores/storageStore'
import { useUnlockStore } from '@/stores/unlockStore'

const inputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

const MODE_LABELS: Record<StorageMode, string> = {
  auto: 'Automático (backend → GitHub → navegador)',
  backend: 'Backend Flask',
  github: 'Repositorio de GitHub (JSON)',
  browser: 'Solo este navegador',
}

const FIELDS: { name: keyof GitHubConfig; label: string }[] = [
  { name: 'owner', label: 'Propietario' },
  { name: 'repo', label: 'Repositorio' },
  { name: 'branch', label: 'Rama' },
  { name: 'path', label: 'Ruta del archivo JSON' },
]

const EMPTY: GitHubConfig = { owner: '', repo: '', branch: 'main', path: 'data/speak-mentor.json' }

export function StorageSettings() {
  const { mode, github, setMode, setGitHub } = useStorageStore()
  const unlocked = useUnlockStore((s) => s.githubToken !== null)
  const setToken = useUnlockStore((s) => s.setGitHubToken)
  const { target, locked } = useStorageTarget()

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="storage-mode">
          Dónde guardar el historial
        </label>
        <select
          id="storage-mode"
          className={inputClass}
          value={mode}
          onChange={(e) => {
            setMode(e.target.value as StorageMode)
            void refreshHistory()
          }}
        >
          {(Object.keys(MODE_LABELS) as StorageMode[]).map((m) => (
            <option key={m} value={m}>{MODE_LABELS[m]}</option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Activo ahora: {STORAGE_LABELS[target]}{locked ? ' (token bloqueado)' : ''}. Cada destino
          tiene su propio historial; cambiar de destino no mueve los datos.
        </p>
      </div>

      {!github ? (
        <GitHubSetup
          onSaved={(settings, token) => {
            setToken(token)
            setGitHub(settings)
            void refreshHistory()
          }}
        />
      ) : (
        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-sm font-medium">
            {github.owner}/{github.repo} · {github.branch} · {github.path}
          </p>
          {unlocked ? (
            <Button variant="outline" onClick={() => setToken(null)}>Bloquear</Button>
          ) : (
            <UnlockForm
              onUnlock={async (password) => {
                setToken(await decryptSecret(github.encryptedToken, password))
                void refreshHistory()
              }}
            />
          )}
          <Button
            variant="outline"
            onClick={() => {
              setToken(null)
              setGitHub(null)
              void refreshHistory()
              toast.info('Token de GitHub olvidado')
            }}
          >
            Olvidar token
          </Button>
        </div>
      )}
    </div>
  )
}

function GitHubSetup({
  onSaved,
}: {
  onSaved: (
    settings: GitHubConfig & { encryptedToken: Awaited<ReturnType<typeof encryptSecret>> },
    token: string,
  ) => void
}) {
  const [config, setConfig] = useState(EMPTY)
  const [token, setTokenDraft] = useState('')
  const [password, setPassword] = useState('')
  const [acceptPublic, setAcceptPublic] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const complete =
    FIELDS.every((f) => config[f.name].trim()) && token.trim() && password.length >= 6

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const clean = Object.fromEntries(
        FIELDS.map((f) => [f.name, config[f.name].trim()]),
      ) as unknown as GitHubConfig
      const info = await inspectRepo(clean, token.trim())
      if (!info.canWrite) throw new Error('El token no puede escribir en ese repositorio.')
      if (!info.private && !acceptPublic) {
        setIsPublic(true)
        return
      }
      onSaved({ ...clean, encryptedToken: await encryptSecret(token.trim(), password) }, token.trim())
      toast.success('GitHub configurado')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo verificar el repositorio')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium">Guardar en un repositorio de GitHub</p>
      <p className="text-xs text-muted-foreground">
        Usa un token <em>fine-grained</em> limitado a un solo repositorio, con permiso Contents:
        Read and write. Se guarda cifrado en este navegador y solo se envía a api.github.com.
        Se recomienda un repositorio privado.
      </p>

      {FIELDS.map((field) => (
        <div key={field.name} className="space-y-1">
          <label className="text-sm font-medium" htmlFor={`gh-${field.name}`}>{field.label}</label>
          <input
            id={`gh-${field.name}`}
            className={inputClass}
            value={config[field.name]}
            onChange={(e) => {
              setConfig((c) => ({ ...c, [field.name]: e.target.value }))
              setIsPublic(false)
              setAcceptPublic(false)
            }}
          />
        </div>
      ))}

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="gh-token">Token de GitHub</label>
        <input
          id="gh-token"
          type="password"
          autoComplete="off"
          className={inputClass}
          value={token}
          onChange={(e) => setTokenDraft(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="gh-password">
          Contraseña maestra (mín 6 caracteres)
        </label>
        <input
          id="gh-password"
          type="password"
          autoComplete="new-password"
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {isPublic && (
        <label role="alert" className="flex items-start gap-2 text-xs text-destructive">
          <input
            type="checkbox"
            checked={acceptPublic}
            onChange={(e) => setAcceptPublic(e.target.checked)}
          />
          Este repositorio es PÚBLICO: cualquiera podrá leer tus textos y errores. Marca la casilla
          y vuelve a guardar si lo aceptas.
        </label>
      )}

      <Button type="submit" disabled={!complete || busy}>
        {busy ? <Spinner className="mr-2" /> : null}
        Verificar y guardar
      </Button>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </form>
  )
}

function UnlockForm({ onUnlock }: { onUnlock: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    try {
      await onUnlock(password)
    } catch {
      setError('Contraseña incorrecta')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="text-sm font-medium" htmlFor="gh-unlock">Contraseña maestra</label>
      <input
        id="gh-unlock"
        type="password"
        autoComplete="current-password"
        className={inputClass}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button type="submit" disabled={!password}>Desbloquear</Button>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </form>
  )
}
