import { t } from '@/i18n'
import { useSettingsStore, type RemoteProviderId } from '@/stores/settingsStore'
import { useBackendProviders } from '@/shared/llm/hooks'
import { DEFAULT_MODELS } from '@/shared/llm/defaults'
import { BackendPanel } from './BackendPanel'
import { ProviderLinks } from './ProviderLinks'
import { RemoteProviderPanel } from './RemoteProviderPanel'

interface Props {
  providerId: RemoteProviderId
  label: string
}

type Source = 'backend' | 'direct'

/** Lets the user pick the server-side model or a direct call from the browser. */
export function RemoteProviderSection({ providerId, label }: Props) {
  const entry = useSettingsStore((s) => s.remoteProviders[providerId])
  const setRemoteProvider = useSettingsStore((s) => s.setRemoteProvider)
  const { availability } = useBackendProviders()
  const source: Source = entry?.useBackend ? 'backend' : 'direct'
  const backendHasKey = availability?.[providerId] === true

  const select = (next: Source) =>
    setRemoteProvider(providerId, {
      ...entry,
      model: entry?.model ?? DEFAULT_MODELS[providerId],
      useBackend: next === 'backend',
    })

  return (
    <div className="space-y-4">
      <ProviderLinks providerId={providerId} />

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t('Origen del modelo')}</legend>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={`${providerId}-source`}
              checked={source === 'direct'}
              onChange={() => select('direct')}
            />
            {t('Directo desde el navegador')}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={`${providerId}-source`}
              checked={source === 'backend'}
              disabled={!backendHasKey && source !== 'backend'}
              onChange={() => select('backend')}
            />
            {t('Modelo del backend')}
          </label>
        </div>
        {!backendHasKey && (
          <p className="text-xs text-muted-foreground">
            {t('El modelo del backend requiere el backend activo con {name}.', { name: `${providerId.toUpperCase()}_API_KEY` })}
          </p>
        )}
      </fieldset>

      {source === 'backend' ? (
        <BackendPanel providerId={providerId} label={label} />
      ) : (
        <RemoteProviderPanel providerId={providerId} label={label} />
      )}
    </div>
  )
}
