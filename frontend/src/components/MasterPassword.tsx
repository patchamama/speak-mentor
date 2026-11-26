import { useId, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'
import { MIN_PASSWORD_LENGTH, migrateSecret, unlockVault, type SecretId } from '@/shared/crypto/vault'
import { refreshHistory } from '@/shared/storage'
import { useUnlockStore } from '@/stores/unlockStore'
import { useHasStoredSecrets } from './secretHooks'

const passwordInputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

function PasswordForm({
  label,
  submitLabel,
  onSubmit,
}: {
  label: string
  submitLabel: string
  onSubmit: (password: string) => Promise<void>
}) {
  const id = useId()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await onSubmit(password)
    } catch {
      setError('Contraseña incorrecta')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="block text-sm font-medium" htmlFor={id}>{label}</label>
      <div className="flex gap-2">
        <input
          id={id}
          type="password"
          autoComplete="current-password"
          className={passwordInputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" disabled={!password || busy}>
          {busy ? <Spinner className="mr-2" /> : null}
          {submitLabel}
        </Button>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </form>
  )
}

/** The only place where the master password is typed. */
export function MasterPasswordSection() {
  const unlocked = useUnlockStore((s) => s.masterPassword !== null)
  const lock = useUnlockStore((s) => s.lock)
  const hasSecrets = useHasStoredSecrets()

  return (
    <section aria-label="Clave maestra" className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
      <h3 className="text-sm font-semibold">Clave maestra</h3>
      <p className="text-xs text-muted-foreground">
        Cifra tus API keys y tu token de GitHub en este navegador. Nunca se guarda: se pierde al
        cerrar o recargar la pestaña. Ollama y el modelo del backend no la necesitan.
      </p>
      {unlocked ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <p>🔓 Claves desbloqueadas</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              lock()
              void refreshHistory()
            }}
          >
            Bloquear todo
          </Button>
        </div>
      ) : hasSecrets ? (
        <UnlockForm />
      ) : (
        <CreateForm />
      )}
    </section>
  )
}

function UnlockForm() {
  return (
    <PasswordForm
      label="Clave maestra"
      submitLabel="Desbloquear"
      onSubmit={async (password) => {
        const { failed } = await unlockVault(password)
        void refreshHistory()
        if (failed.length > 0) {
          toast.warning(`Usan otra contraseña: ${failed.join(', ')}.`)
        } else {
          toast.success('Claves desbloqueadas')
        }
      }}
    />
  )
}

/** First use: confirmed twice, because a typo here cannot be recovered. */
function CreateForm() {
  const id = useId()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const valid = password.length >= MIN_PASSWORD_LENGTH && password === confirm

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault()
        if (valid) void unlockVault(password)
      }}
    >
      {[
        { key: 'new', label: `Clave maestra (mín ${MIN_PASSWORD_LENGTH} caracteres)`, value: password, set: setPassword },
        { key: 'confirm', label: 'Repetir la clave', value: confirm, set: setConfirm },
      ].map((field) => (
        <div key={field.key} className="space-y-1">
          <label className="block text-sm font-medium" htmlFor={`${id}-${field.key}`}>{field.label}</label>
          <input
            id={`${id}-${field.key}`}
            type="password"
            autoComplete="new-password"
            className={passwordInputClass}
            value={field.value}
            onChange={(e) => field.set(e.target.value)}
          />
        </div>
      ))}
      {confirm && confirm !== password && (
        <p className="text-xs text-destructive">Las claves no coinciden</p>
      )}
      <Button type="submit" disabled={!valid}>Activar clave maestra</Button>
    </form>
  )
}

/** Placeholder for a stored secret that is not available in memory. */
export function LockedSecret({
  id,
  name,
  onForget,
}: {
  id: SecretId
  name: string
  onForget: () => void
}) {
  const unlocked = useUnlockStore((s) => s.masterPassword !== null)

  return (
    <div className="space-y-3 rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-xs">
      <p className="font-semibold">🔒 {name} bloqueado</p>
      {unlocked ? (
        <>
          <p className="text-muted-foreground">Se cifró con otra contraseña.</p>
          <PasswordForm
            label={`Contraseña anterior de ${name}`}
            submitLabel="Migrar"
            onSubmit={async (password) => {
              await migrateSecret(id, password)
              void refreshHistory()
            }}
          />
        </>
      ) : (
        <p className="text-muted-foreground">
          Introduce la clave maestra arriba.
        </p>
      )}
      <Button type="button" size="sm" variant="outline" onClick={onForget}>
        Olvidar y configurar de nuevo
      </Button>
    </div>
  )
}

/** Hint for setup forms, which stay disabled until the vault is open. */
export function VaultRequiredHint() {
  const unlocked = useUnlockStore((s) => s.masterPassword !== null)
  if (unlocked) return null
  return <p className="text-xs text-muted-foreground">Primero activa o introduce la clave maestra arriba.</p>
}
