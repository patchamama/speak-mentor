import { t } from '@/i18n'
import { useId, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'
import { MIN_PASSWORD_LENGTH, getPasswordHint, migrateSecret, unlockVault, type SecretId } from '@/shared/crypto/vault'
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
      setError(t('Contraseña incorrecta'))
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
    <section aria-label={t('Clave maestra')} className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
      <h3 className="text-sm font-semibold">{t('Clave maestra')}</h3>
      <p className="text-xs text-muted-foreground">
        {t('Cifra tus API keys y tu token de GitHub en este navegador. La clave completa no se guarda (se pierde al cerrar o recargar la pestaña); solo sus 3 últimos caracteres, como recordatorio. Usa una clave larga. Ollama y el modelo del backend no la necesitan.')}
      </p>
      {unlocked ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <p>🔓 {t('Claves desbloqueadas')}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              lock()
              void refreshHistory()
            }}
          >
            {t('Bloquear todo')}
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
  const hint = getPasswordHint()

  return (
    <div className="space-y-2">
      {hint && (
        <p className="text-sm">
          {t('Recordatorio: tu clave termina en')} <code className="bg-muted px-1 rounded">{hint}</code>
        </p>
      )}
      <PasswordForm
        label={t('Clave maestra')}
        submitLabel={t('Desbloquear')}
        onSubmit={async (password) => {
          const { failed } = await unlockVault(password)
          void refreshHistory()
          if (failed.length > 0) {
            toast.warning(t('Usan otra contraseña: {names}.', { names: failed.join(', ') }))
          } else {
            toast.success(t('Claves desbloqueadas'))
          }
        }}
      />
    </div>
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
        { key: 'new', label: t('Clave maestra (mín {count} caracteres)', { count: MIN_PASSWORD_LENGTH }), value: password, set: setPassword },
        { key: 'confirm', label: t('Repetir la clave'), value: confirm, set: setConfirm },
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
        <p className="text-xs text-destructive">{t('Las claves no coinciden')}</p>
      )}
      <Button type="submit" disabled={!valid}>{t('Activar clave maestra')}</Button>
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
      <p className="font-semibold">🔒 {t('{name} bloqueado', { name })}</p>
      {unlocked ? (
        <>
          <p className="text-muted-foreground">{t('Se cifró con otra contraseña.')}</p>
          <PasswordForm
            label={t('Contraseña anterior de {name}', { name })}
            submitLabel={t('Migrar')}
            onSubmit={async (password) => {
              await migrateSecret(id, password)
              void refreshHistory()
            }}
          />
        </>
      ) : (
        <p className="text-muted-foreground">
          {t('Introduce la clave maestra arriba.')}
        </p>
      )}
      <Button type="button" size="sm" variant="outline" onClick={onForget}>
        {t('Olvidar y configurar de nuevo')}
      </Button>
    </div>
  )
}

/** Hint for setup forms, which stay disabled until the vault is open. */
export function VaultRequiredHint() {
  const unlocked = useUnlockStore((s) => s.masterPassword !== null)
  if (unlocked) return null
  return <p className="text-xs text-muted-foreground">{t('Primero activa o introduce la clave maestra arriba.')}</p>
}
