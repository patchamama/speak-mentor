import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useSettingsStore } from '@/stores/settingsStore'
import { useBackendProviders } from '@/shared/llm/hooks'
import { fetchBackendModels } from '@/shared/api/flaskClient'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'

const inputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

const DEFAULT_OPENAI_MODEL = 'gpt-4o'

export function OpenAIPanel() {
  const entry = useSettingsStore((s) => s.remoteProviders.openai)
  const setRemoteProvider = useSettingsStore((s) => s.setRemoteProvider)
  const updateRemoteProvider = useSettingsStore((s) => s.updateRemoteProvider)
  const removeRemoteProvider = useSettingsStore((s) => s.removeRemoteProvider)

  const { availability, loading, error, refetch } = useBackendProviders()
  const [models, setModels] = useState<{ name: string }[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelsError, setModelsError] = useState<string | null>(null)
  const [manualModel, setManualModel] = useState(entry?.model ?? '')
  const [testing, setTesting] = useState(false)

  const backendHasKey = availability?.openai === true
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
      const list = await fetchBackendModels('openai')
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
      const list = await fetchBackendModels('openai')
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

  const enableOpenAI = async () => {
    setRemoteProvider('openai', {
      model: entry?.model ?? DEFAULT_OPENAI_MODEL,
      useBackend: true,
    })
    setManualModel(entry?.model ?? DEFAULT_OPENAI_MODEL)
    toast.success('OpenAI habilitado (usando backend)')
  }

  const onChangeModel = (model: string) => {
    if (isConfigured) {
      updateRemoteProvider('openai', { model })
    } else {
      setRemoteProvider('openai', { model, useBackend: true })
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

  if (error || !availability) {
    return (
      <div className="space-y-3">
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs">
          <p className="font-semibold">No se pudo contactar al backend</p>
          <p className="text-muted-foreground mt-1">
            OpenAI necesita el proxy Flask porque el navegador no puede llamar directo a su API
            (CORS). Asegurate de que el backend esté corriendo en <code className="bg-muted px-1 rounded">localhost:5001</code>.
          </p>
          {error && <p className="text-destructive mt-2">{error}</p>}
        </div>
        <Button variant="outline" onClick={refetch}>Reintentar</Button>
      </div>
    )
  }

  if (!backendHasKey) {
    return (
      <div className="space-y-3">
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs space-y-2">
          <p className="font-semibold">API key no configurada en el backend</p>
          <p className="text-muted-foreground">
            Definí <code className="bg-muted px-1 rounded">OPENAI_API_KEY</code> en el entorno del
            backend Flask y reiniciá. Las opciones equivalentes para los otros proveedores son
            <code className="bg-muted px-1 rounded ml-1">ANTHROPIC_API_KEY</code> y
            <code className="bg-muted px-1 rounded ml-1">GEMINI_API_KEY</code>.
          </p>
          <pre className="text-xs bg-muted rounded-md px-3 py-2 overflow-x-auto select-all mt-2">
{`export OPENAI_API_KEY=sk-...
cd backend && flask run --port 5001`}
          </pre>
        </div>
        <Button variant="outline" onClick={refetch}>Volver a comprobar</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-xs flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">🔓 OpenAI listo (vía backend)</p>
          <p className="text-muted-foreground mt-1">
            La API key vive en el backend; el navegador nunca la ve. Todas las llamadas pasan por
            <code className="bg-muted px-1 rounded ml-1">/api/llm/chat</code>.
          </p>
        </div>
        {!isConfigured && (
          <Button size="sm" onClick={enableOpenAI}>Habilitar</Button>
        )}
      </div>

      {isConfigured && (
        <>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium" htmlFor="openai-model-select">Modelo</label>
              {models.length > 0 && (
                <span className="text-xs text-muted-foreground">{models.length} disponibles</span>
              )}
            </div>

            {models.length > 0 ? (
              <select
                id="openai-model-select"
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
            <label className="text-sm font-medium" htmlFor="openai-model-manual">
              O ingresá un modelo manualmente
            </label>
            <div className="flex gap-2">
              <input
                id="openai-model-manual"
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
            <Button
              variant="outline"
              onClick={() => {
                removeRemoteProvider('openai')
                toast.info('OpenAI deshabilitado')
              }}
            >
              Deshabilitar OpenAI
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
