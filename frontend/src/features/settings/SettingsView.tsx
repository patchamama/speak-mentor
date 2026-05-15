import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useSettingsStore } from '@/stores/settingsStore'
import { useOllamaModels } from './hooks/useOllamaModels'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'
import type { OllamaConfig } from '@/shared/types'

const DEFAULT_MODEL = 'translategemma:12b'

export function SettingsView() {
  const { ollama, setOllama } = useSettingsStore()
  const { models, loading, error, testConnection } = useOllamaModels()

  const { register, handleSubmit, setValue, watch } = useForm<OllamaConfig>({
    defaultValues: ollama,
  })

  const selectedModel = watch('model')

  // When models load, auto-select translategemma:12b if present; otherwise keep current
  useEffect(() => {
    if (models.length === 0) return
    const hasDefault = models.some((m) => m.name === DEFAULT_MODEL)
    const currentIsListed = models.some((m) => m.name === selectedModel)
    if (!currentIsListed && hasDefault) {
      setValue('model', DEFAULT_MODEL)
    }
  }, [models, selectedModel, setValue])

  const onSave = (data: OllamaConfig) => {
    setOllama({ ...data, port: Number(data.port) })
    toast.success('Configuración guardada')
  }

  const inputClass =
    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

  return (
    <div className="max-w-lg space-y-6">
      <h2 className="text-lg font-semibold">Configuración de Ollama</h2>

      <form onSubmit={handleSubmit(onSave)} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="url">URL</label>
          <input id="url" className={inputClass} {...register('url', { required: true })} />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="port">Puerto</label>
          <input
            id="port"
            type="number"
            className={inputClass}
            {...register('port', { required: true, valueAsNumber: true })}
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium" htmlFor="model">Modelo</label>
            {models.length > 0 && (
              <span className="text-xs text-muted-foreground">{models.length} instalados</span>
            )}
          </div>

          {models.length > 0 ? (
            <select
              id="model"
              className={inputClass}
              {...register('model', { required: true })}
            >
              {models.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="model"
              className={inputClass}
              placeholder={DEFAULT_MODEL}
              {...register('model', { required: true })}
            />
          )}

          {models.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Probá la conexión para cargar los modelos disponibles.
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Button type="submit">Guardar</Button>
          <Button
            type="button"
            variant="outline"
            onClick={testConnection}
            disabled={loading}
          >
            {loading ? <Spinner className="mr-2" /> : null}
            Probar conexión
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>
    </div>
  )
}
