import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useSettingsStore, type RemoteProviderId } from '@/stores/settingsStore'
import { useBackendProviders } from '@/shared/llm/hooks'
import { fetchBackendModels } from '@/shared/api/flaskClient'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'

const inputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

interface Props {
  providerId: RemoteProviderId
  label: string
}

export function BackendPanel({ providerId, label }: Props) {
  const entry = useSettingsStore((s) => s.remoteProviders[providerId])
  const setRemoteProvider = useSettingsStore((s) => s.setRemoteProvider)
  const updateRemoteProvider = useSettingsStore((s) => s.updateRemoteProvider)

  const { availability, loading, error, refetch } = useBackendProviders()
  const [models, setModels] = useState<{ name: string }[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelsError, setModelsError] = useState<string | null>(null)
  const [manualModel, setManualModel] = useState(entry?.model ?? '')
  const [testing, setTesting] = useState(false)

  const backendHasKey = availability?.[providerId] === true
  const isConfigured = Boolean(entry)

  useEffect(() => {
    if (!backendHasKey) return
    void loadModels()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendHasKey])

  const loadModels = async () => {
    setModelsLoading(true)
    setModelsError(null)
    try {
      const list = await fetchBackendModels(providerId)
      setModels(list)
    } catch (err) {
      setModelsError(err instanceof Error ? err.message : 'Error al listar modelos')
    } finally {
      setModelsLoading(false)
    }
  }

  const testConnection = async () => {
    setTesting(true)
    try {
      const list = await fetchBackendModels(providerId)
      setModels(list)
      toast.success(`Conexión OK — ${list.length} modelos disponibles`)
    } catch (err) {
      toast.error(
        `Falló la conexión: ${err instanceof Error ? err.message : 'error desconocido'}`,
      )
    } finally {
      setTesting(false)
    }
  }

  const onChangeModel = (model: string) => {
    if (isConfigured) {
      updateRemoteProvider(providerId, { model })
    } else {
      setRemoteProvider(providerId, { model, useBackend: true })
    }
    setManualModel(model)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner /> Consultando backend…
      </div>
    )
  }

  if (error || !availability?.[providerId]) {
    return (
      <div className="space-y-3">
        <p role="alert" className="text-xs text-destructive">
          El backend no tiene {providerId.toUpperCase()}_API_KEY configurada o no responde.
          Puedes usar el modo directo desde el navegador.
        </p>
        <Button variant="outline" onClick={refetch}>Volver a comprobar</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-xs">
        <p className="font-semibold">{label}: modelo del backend</p>
        <p className="text-muted-foreground mt-1">
          La API key vive en el backend; el navegador nunca la ve.
        </p>
      </div>

      {isConfigured && (
        <>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium" htmlFor={`${providerId}-backend-model-select`}>Modelo</label>
              {models.length > 0 && (
                <span className="text-xs text-muted-foreground">{models.length} disponibles</span>
              )}
            </div>

            {models.length > 0 ? (
              <select
                id={`${providerId}-backend-model-select`}
                className={inputClass}
                value={entry!.model}
                onChange={(e) => onChangeModel(e.target.value)}
              >
                {[...models].sort((a, b) => a.name.localeCompare(b.name)).map((m) => (
                  <option key={m.name} value={m.name}>{m.name}</option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-muted-foreground">
                {modelsLoading ? 'Cargando modelos…' : 'Sin lista de modelos cargada'}
              </p>
            )}

            {modelsError && <p className="text-xs text-destructive">{modelsError}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor={`${providerId}-backend-model-manual`}>
              O ingresá un modelo manualmente
            </label>
            <div className="flex gap-2">
              <input
                id={`${providerId}-backend-model-manual`}
                type="text"
                className={inputClass}
                value={manualModel}
                onChange={(e) => setManualModel(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => onChangeModel(manualModel.trim())}
                disabled={!manualModel.trim() || manualModel === entry!.model}
              >
                Aplicar
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={testConnection} disabled={testing}>
              {testing ? <Spinner className="mr-2" /> : null}
              Probar conexión
            </Button>
            <Button variant="outline" onClick={loadModels} disabled={modelsLoading}>
              {modelsLoading ? <Spinner className="mr-2" /> : null}
              Recargar modelos
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
