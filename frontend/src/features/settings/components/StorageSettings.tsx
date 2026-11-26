import { msg, t } from '@/i18n'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'
import { sealSecret } from '@/shared/crypto/vault'
import { LockedSecret, VaultRequiredHint } from '@/components/MasterPassword'
import { useVaultOpen } from '@/components/secretHooks'
import { DATA_REPO, ensureDataRepo } from '@/shared/storage/github'
import { STORAGE_LABELS, type StorageMode } from '@/shared/storage/resolve'
import { refreshHistory } from '@/shared/storage'
import { useStorageTarget } from '@/shared/storage/useStorageTarget'
import { useStorageStore, type GitHubStorageSettings } from '@/stores/storageStore'
import { useUnlockStore } from '@/stores/unlockStore'

const inputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

const MODE_LABELS: Record<StorageMode, string> = {
  auto: msg('Automático (backend → GitHub → navegador)'),
  backend: msg('Backend Flask'),
  github: msg('Repositorio de GitHub (JSON)'),
  browser: msg('Solo este navegador'),
}

export function StorageSettings() {
  const { mode, github, setMode, setGitHub } = useStorageStore()
  const unlocked = useUnlockStore((s) => s.githubToken !== null)
  const setToken = useUnlockStore((s) => s.setGitHubToken)
  const { target, locked } = useStorageTarget()
  const [changingToken, setChangingToken] = useState(false)

  const connect = (settings: GitHubStorageSettings, token: string) => {
    setToken(token)
    setGitHub(settings)
    setChangingToken(false)
    void refreshHistory()
  }

  const forget = () => {
    setChangingToken(false)
    setToken(null)
    setGitHub(null)
    void refreshHistory()
    toast.info(t('Token de GitHub olvidado'))
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="storage-mode">
          {t('Dónde guardar el historial')}
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
            <option key={m} value={m}>{t(MODE_LABELS[m])}</option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          {t('Activo ahora: {target}.', { target: t(STORAGE_LABELS[target]) })}
          {locked ? ` ${t('(token bloqueado)')}` : ''}{' '}
          {t('Cada destino tiene su propio historial; cambiar de destino no mueve los datos.')}
        </p>
      </div>

      {!github ? (
        <GitHubSetup onSaved={connect} />
      ) : (
        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-sm font-medium">
            {github.owner}/{github.repo} · {github.branch} · {github.path}
          </p>
          {!unlocked && (
            <LockedSecret id="github" name={t('Token de GitHub')} onForget={forget} />
          )}
          <p className="text-xs text-muted-foreground">
            {t('Si la conexión falla (token vencido, revocado o sin permisos), cambia el token. El actual se conserva hasta que el nuevo funcione.')}
          </p>
          <div className="flex flex-wrap gap-3">
            {!changingToken && (
              <Button type="button" variant="outline" onClick={() => setChangingToken(true)}>
                {t('Cambiar token')}
              </Button>
            )}
            {unlocked && (
              <Button type="button" variant="outline" onClick={forget}>{t('Olvidar token')}</Button>
            )}
          </div>
          {changingToken && (
            <GitHubSetup
              initialUser={github.owner}
              onSaved={connect}
              onCancel={() => setChangingToken(false)}
            />
          )}
        </div>
      )}
    </div>
  )
}

function GitHubSetup({
  initialUser = '',
  onSaved,
  onCancel,
}: {
  initialUser?: string
  onSaved: (settings: GitHubStorageSettings, token: string) => void
  onCancel?: () => void
}) {
  const [user, setUser] = useState(initialUser)
  const [token, setTokenDraft] = useState('')
  const [publicRepo, setPublicRepo] = useState(false)
  const [acceptPublic, setAcceptPublic] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const vaultOpen = useVaultOpen()

  const resetWarning = () => {
    setPublicRepo(false)
    setAcceptPublic(false)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const repo = await ensureDataRepo(token.trim(), user)
      if (!repo.isPrivate && !acceptPublic) {
        setPublicRepo(true)
        return
      }
      const encryptedToken = await sealSecret(token.trim())
      onSaved({ ...repo.config, encryptedToken }, token.trim())
      toast.success(
        repo.created
          ? t('Repositorio privado {name} creado', { name: `${repo.config.owner}/${repo.config.repo}` })
          : t('Usando {name}', { name: `${repo.config.owner}/${repo.config.repo}` }),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : t('No se pudo preparar el repositorio'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium">{onCancel ? t('Nuevo token de GitHub') : t('Guardar en tu GitHub')}</p>
      <p className="text-xs text-muted-foreground">
        {t('Se usa el repositorio {repo}; si no existe, se crea como privado. Para crearlo, el token necesita ser clásico con el scope "repo", o fine-grained con acceso a todos los repositorios y permisos Administration y Contents (Read and write). Si ya creaste el repositorio, basta un token fine-grained limitado a él con Contents. El token se guarda cifrado y solo se envía a api.github.com.', { repo: DATA_REPO })}
      </p>

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="gh-user">
          {t('Usuario o URL de GitHub (opcional)')}
        </label>
        <input
          id="gh-user"
          className={inputClass}
          placeholder={t('https://github.com/tu-usuario')}
          value={user}
          onChange={(e) => {
            setUser(e.target.value)
            resetWarning()
          }}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="gh-token">{t('Token de GitHub')}</label>
        <input
          id="gh-token"
          type="password"
          autoComplete="off"
          className={inputClass}
          value={token}
          onChange={(e) => {
            setTokenDraft(e.target.value)
            resetWarning()
          }}
        />
      </div>

      <VaultRequiredHint />

      {publicRepo && (
        <label role="alert" className="flex items-start gap-2 text-xs text-destructive">
          <input
            type="checkbox"
            checked={acceptPublic}
            onChange={(e) => setAcceptPublic(e.target.checked)}
          />
          {t('{repo} es PÚBLICO: cualquiera podrá leer tus textos y errores. Hazlo privado en GitHub, o marca la casilla y vuelve a guardar si lo aceptas.', { repo: DATA_REPO })}
        </label>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={!token.trim() || !vaultOpen || busy}>
          {busy ? <Spinner className="mr-2" /> : null}
          {t('Conectar GitHub')}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>{t('Cancelar')}</Button>
        )}
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </form>
  )
}
