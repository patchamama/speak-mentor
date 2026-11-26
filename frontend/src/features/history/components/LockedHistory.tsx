import { t } from '@/i18n'
import { Button } from '@/shared/ui/Button'
import { useStorageStore } from '@/stores/storageStore'
import { useUnlockStore } from '@/stores/unlockStore'

/** The token is saved but unreadable until unlocked: a normal state, not an error. */
export function LockedHistory({ onUnlock }: { onUnlock?: () => void }) {
  const github = useStorageStore((s) => s.github)
  const vaultOpen = useUnlockStore((s) => s.masterPassword !== null)
  if (!github) return null

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-6 space-y-3">
      <p className="text-sm font-medium">
        🔒 {t('Tu historial está en {repo}', { repo: `${github.owner}/${github.repo}` })}
      </p>
      <p className="text-sm text-muted-foreground">
        {vaultOpen
          ? t('El token de GitHub se cifró con otra contraseña. Mígralo o cámbialo en Conexión y almacenamiento.')
          : t('Tu token de GitHub ya está guardado, pero cifrado. Para leer tu historial introduce la clave maestra: como no se guarda, se pide en cada visita.')}
      </p>
      {onUnlock && (
        <Button type="button" onClick={onUnlock}>
          {vaultOpen ? t('Ir a Conexión y almacenamiento') : t('Desbloquear claves')}
        </Button>
      )}
    </div>
  )
}
