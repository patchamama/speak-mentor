import { t } from '@/i18n'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useSettingsStore, type RemoteProviderId } from '@/stores/settingsStore'
import { useUnlockStore } from '@/stores/unlockStore'
import type { EncryptedSecret } from '@/shared/crypto/secret'
import { sealSecret } from '@/shared/crypto/vault'
import { LockedSecret, VaultRequiredHint } from '@/components/MasterPassword'
import { useVaultOpen } from '@/components/secretHooks'
import { buildProvider } from '@/shared/llm/registry'
import { DEFAULT_MODELS } from '@/shared/llm/defaults'
import type { LLMConfig, LLMModel } from '@/shared/llm/types'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'

interface Props {
  providerId: RemoteProviderId
  label: string
}

const inputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

const KEY_PLACEHOLDERS: Record<RemoteProviderId, string> = {
  openai: 'sk-...',
  anthropic: 'sk-ant-...',
  gemini: 'AIza...',
}

function buildRemoteConfig(providerId: RemoteProviderId, model: string, baseUrl: string | undefined): LLMConfig {
  if (providerId === 'anthropic') {
    return { provider: 'anthropic', apiKey: '', model, baseUrl }
  }
  return { provider: providerId, apiKey: '', model, baseUrl }
}

export function RemoteProviderPanel({ providerId, label }: Props) {
  const entry = useSettingsStore((s) => s.remoteProviders[providerId])
  const setRemoteProvider = useSettingsStore((s) => s.setRemoteProvider)
  const updateRemoteProvider = useSettingsStore((s) => s.updateRemoteProvider)
  const removeRemoteProvider = useSettingsStore((s) => s.removeRemoteProvider)

  const decryptedKey = useUnlockStore((s) => s.decryptedKeys[providerId])
  const setDecryptedKey = useUnlockStore((s) => s.setDecryptedKey)
  const clearProvider = useUnlockStore((s) => s.clearProvider)

  // No local key yet → first-time setup form
  if (!entry?.encryptedApiKey) {
    return (
      <FirstTimeSetup
        providerId={providerId}
        label={label}
        onSaved={(payload) => {
          setRemoteProvider(providerId, { ...payload.entry, useBackend: false })
          setDecryptedKey(providerId, payload.apiKey)
          toast.success(t('{name} configurado y verificado', { name: label }))
        }}
      />
    )
  }

  // Stored key not available in memory
  if (!decryptedKey) {
    return (
      <LockedSecret
        id={providerId}
        name={label}
        onForget={() => {
          removeRemoteProvider(providerId)
          clearProvider(providerId)
          toast.info(t('{name} olvidado', { name: label }))
        }}
      />
    )
  }

  // Unlocked → model picker + lock button
  return (
    <UnlockedPanel
      providerId={providerId}
      label={label}
      decryptedKey={decryptedKey}
      currentModel={entry.model}
      baseUrl={entry.baseUrl}
      onChangeModel={(model) => updateRemoteProvider(providerId, { model })}
      onForget={() => {
        removeRemoteProvider(providerId)
        clearProvider(providerId)
        toast.info(t('{name} olvidado', { name: label }))
      }}
    />
  )
}

// ── First-time setup ────────────────────────────────────────────────────────

interface FirstTimePayload {
  entry: { encryptedApiKey: EncryptedSecret; model: string; baseUrl?: string }
  apiKey: string
}

function FirstTimeSetup({
  providerId,
  label,
  onSaved,
}: {
  providerId: RemoteProviderId
  label: string
  onSaved: (payload: FirstTimePayload) => void
}) {
  const [apiKey, setApiKey] = useState('')
  const vaultOpen = useVaultOpen()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = Boolean(apiKey.trim()) && vaultOpen

  const handleSubmit = async () => {
    setError(null)
    setBusy(true)
    try {
      // Verify the key reaches the provider before persisting anything
      const tempConfig = buildRemoteConfig(providerId, 'default', undefined)
      const provider = buildProvider(tempConfig, { apiKey: apiKey.trim() })
      const models = await provider.listModels()
      const preferred = models.find((m) => m.name === DEFAULT_MODELS[providerId])?.name
      const resolvedModel = preferred || models[0]?.name || ''
      if (!resolvedModel) throw new Error(t('No se encontró ningún modelo disponible'))

      const encryptedApiKey = await sealSecret(apiKey.trim())
      onSaved({
        entry: { encryptedApiKey, model: resolvedModel },
        apiKey: apiKey.trim(),
      })
    } catch (err) {
      const msg =
        err instanceof Error && err.message ? err.message : t('Error verificando la API key')
      setError(msg.includes('401') || msg.includes('403') || msg.includes('Unauthorized')
        ? t('API key inválida: la rechazó el proveedor.')
        : msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs space-y-1">
        <p className="font-semibold">{t('Configurar {name}', { name: label })}</p>
        <p className="text-muted-foreground">
          {t('La API key se cifra con tu clave maestra. Al conectar se cargan los modelos disponibles.')}
        </p>
      </div>

      <Field label="API key" htmlFor={`${providerId}-api-key`}>
        <input
          id={`${providerId}-api-key`}
          type="password"
          autoComplete="off"
          className={inputClass}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={KEY_PLACEHOLDERS[providerId]}
        />
      </Field>

      <VaultRequiredHint />

      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={!canSubmit || busy}>
          {busy ? <Spinner className="mr-2" /> : null}
          {t('Conectar y cargar modelos')}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

// ── Unlocked panel ──────────────────────────────────────────────────────────

function UnlockedPanel({
  providerId,
  label,
  decryptedKey,
  currentModel,
  baseUrl,
  onChangeModel,
  onForget,
}: {
  providerId: RemoteProviderId
  label: string
  decryptedKey: string
  currentModel: string
  baseUrl: string | undefined
  onChangeModel: (model: string) => void
  onForget: () => void
}) {
  const [models, setModels] = useState<LLMModel[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [modelsError, setModelsError] = useState<string | null>(null)
  const [manualModel, setManualModel] = useState(currentModel)
  const [testing, setTesting] = useState(false)

  const buildActiveProvider = () => {
    const config = buildRemoteConfig(providerId, currentModel, baseUrl)
    return buildProvider(config, { apiKey: decryptedKey })
  }

  const fetchModels = async () => {
    setLoadingModels(true)
    setModelsError(null)
    try {
      const list = await buildActiveProvider().listModels()
      setModels(list)
    } catch (err) {
      setModelsError(err instanceof Error ? err.message : t('No se pudieron cargar los modelos'))
    } finally {
      setLoadingModels(false)
    }
  }

  const testConnection = async () => {
    setTesting(true)
    try {
      const list = await buildActiveProvider().listModels()
      setModels(list)
      toast.success(t('Conexión correcta: {count} modelos disponibles', { count: list.length }))
    } catch (err) {
      toast.error(
        t('Falló la conexión: {message}', { message: err instanceof Error ? err.message : t('Error desconocido') }),
      )
    } finally {
      setTesting(false)
    }
  }

  useEffect(() => {
    setModels([])
    void fetchModels()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-4">
      <p className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-xs">
        🔓 <span className="font-semibold">{label}</span> {t('desbloqueado · directo desde el navegador')}
      </p>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium" htmlFor={`${providerId}-model-select`}>{t('Modelo')}</label>
          {models.length > 0 && (
            <span className="text-xs text-muted-foreground">{t('{count} disponibles', { count: models.length })}</span>
          )}
        </div>

        {models.length > 0 ? (
          <select
            id={`${providerId}-model-select`}
            className={inputClass}
            value={currentModel}
            onChange={(e) => {
              onChangeModel(e.target.value)
              setManualModel(e.target.value)
            }}
          >
            {[...models].sort((a, b) => a.name.localeCompare(b.name)).map((m) => (
              <option key={m.name} value={m.name}>{m.name}</option>
            ))}
          </select>
        ) : (
          <p className="text-xs text-muted-foreground">
            {loadingModels ? t('Cargando modelos…') : t('Sin modelos cargados.')}
          </p>
        )}

        {modelsError && <p className="text-xs text-destructive">{modelsError}</p>}
      </div>

      <Field label={t('O escribe un modelo manualmente')} htmlFor={`${providerId}-model-manual`}>
        <div className="flex gap-2">
          <input
            id={`${providerId}-model-manual`}
            type="text"
            className={inputClass}
            value={manualModel}
            onChange={(e) => setManualModel(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (manualModel.trim()) onChangeModel(manualModel.trim())
            }}
            disabled={!manualModel.trim() || manualModel === currentModel}
          >
            {t('Aplicar')}
          </Button>
        </div>
      </Field>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={testConnection} disabled={testing}>
          {testing ? <Spinner className="mr-2" /> : null}
          {t('Probar conexión')}
        </Button>
        <Button variant="outline" onClick={fetchModels} disabled={loadingModels}>
          {loadingModels ? <Spinner className="mr-2" /> : null}
          {t('Recargar modelos')}
        </Button>
        <Button variant="outline" onClick={onForget}>
          {t('Olvidar API key')}
        </Button>
      </div>
    </div>
  )
}

// ── Small helper ────────────────────────────────────────────────────────────

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium" htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  )
}
