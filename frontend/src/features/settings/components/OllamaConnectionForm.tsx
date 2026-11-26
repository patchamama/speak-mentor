import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useSettingsStore } from '@/stores/settingsStore'
import { useOllamaModels } from '../hooks/useOllamaModels'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'
import type { OllamaConfig } from '@/shared/types'

const DEFAULT_MODEL = 'translategemma:12b'

const inputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function OllamaConnectionForm() {
  const ollama = useSettingsStore((s) => s.ollama)
  const setOllama = useSettingsStore((s) => s.setOllama)
  const { models, loading, error, testConnection } = useOllamaModels()
  const { register, handleSubmit, setValue } = useForm<OllamaConfig>({ defaultValues: ollama })

  useEffect(() => {
    setValue('url', ollama.url)
    setValue('port', ollama.port)
    setValue('model', ollama.model)
    setValue('keepAlive', ollama.keepAlive)
  }, [ollama, setValue])

  useEffect(() => {
    if (models.length === 0) return
    const currentIsListed = models.some((m) => m.name === ollama.model)
    if (!currentIsListed) {
      const preferred = models.find((m) => m.name === DEFAULT_MODEL) ?? models[0]
      setValue('model', preferred.name)
    }
  }, [models, ollama.model, setValue])

  const onSubmit = (data: OllamaConfig) => {
    setOllama({ ...data, port: Number(data.port) })
    toast.success('Configuración guardada')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <select id="model" className={inputClass} {...register('model', { required: true })}>
            {[...models].sort((a, b) => a.name.localeCompare(b.name)).map((m) => (
              <option key={m.name} value={m.name}>{m.name}</option>
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

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="keepAlive">
          Keep-alive del modelo
        </label>
        <select id="keepAlive" className={inputClass} {...register('keepAlive', { valueAsNumber: true })}>
          <option value={-1}>Indefinido (recomendado para pipeline)</option>
          <option value={3600}>1 hora</option>
          <option value={1800}>30 minutos</option>
          <option value={600}>10 minutos</option>
          <option value={300}>5 minutos (default Ollama)</option>
          <option value={0}>Descargar después de cada request</option>
        </select>
        <p className="text-xs text-muted-foreground">
          Mantiene el modelo en VRAM entre requests del pipeline. "Indefinido" evita recargas entre passes.
        </p>
      </div>

      <div className="flex gap-3">
        <Button type="submit">Guardar</Button>
        <Button type="button" variant="outline" onClick={testConnection} disabled={loading}>
          {loading ? <Spinner className="mr-2" /> : null}
          Probar conexión
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  )
}
