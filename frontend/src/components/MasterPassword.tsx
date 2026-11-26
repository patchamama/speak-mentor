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

/** Shown app-wide while there are stored secrets and the vault is locked. */
export function MasterPasswordBanner() {
  const locked = useUnlockStore((s) => s.masterPassword === null)
  const hasSecrets = useHasStoredSecrets()
  if (!locked || !hasSecrets) return null

  return (
    <section aria-label="Desbloquear claves" className="rounded-lg border border-primary/30 bg-primary/5 p-4 mb-6">
      <PasswordForm
        label="Contraseña maestra: desbloquea tus API keys y tu token de GitHub"
        submitLabel="Desbloquear"
        onSubmit={async (password) => {
          const { failed } = await unlockVault(password)
          void refreshHistory()
          if (failed.length > 0) {
            toast.warning(`Usan otra contraseña: ${failed.join(', ')}. Revísalo en Configuración.`)
          } else {
            toast.success('Claves desbloqueadas')
          }
        }}
      />
    </section>
  )
}

export function VaultStatus() {
  const unlocked = useUnlockStore((s) => s.masterPassword !== null)
  const lock = useUnlockStore((s) => s.lock)
  if (!unlocked) return null

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border px-4 py-3 text-xs">
      <p>
        🔓 Claves desbloqueadas. La contraseña maestra está solo en memoria y se pierde al cerrar o
        recargar la pestaña.
      </p>
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
          Introduce la contraseña maestra en la barra superior.
        </p>
      )}
      <Button type="button" size="sm" variant="outline" onClick={onForget}>
        Olvidar y configurar de nuevo
      </Button>
    </div>
  )
}

/** Password fields for a setup form; nothing to ask once the vault is open. */
export function NewSecretPassword({
  password,
  confirm,
  onPassword,
  onConfirm,
}: {
  password: string
  confirm: string
  onPassword: (value: string) => void
  onConfirm: (value: string) => void
}) {
  const id = useId()
  const unlocked = useUnlockStore((s) => s.masterPassword !== null)
  const hasSecrets = useHasStoredSecrets()
  if (unlocked) {
    return <p className="text-xs text-muted-foreground">Se cifrará con tu contraseña maestra.</p>
  }

  const fields = [
    { key: 'password', label: `Contraseña maestra (mín ${MIN_PASSWORD_LENGTH} caracteres)`, value: password, set: onPassword },
    ...(hasSecrets
      ? []
      : [{ key: 'confirm', label: 'Confirmar contraseña', value: confirm, set: onConfirm }]),
  ]

  return (
    <>
      {fields.map((field) => (
        <div key={field.key} className="space-y-1">
          <label className="text-sm font-medium" htmlFor={`${id}-${field.key}`}>{field.label}</label>
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
      {!hasSecrets && confirm && confirm !== password && (
        <p className="text-xs text-destructive">Las contraseñas no coinciden</p>
      )}
    </>
  )
}
