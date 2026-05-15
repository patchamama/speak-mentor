import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useSettingsStore } from '@/stores/settingsStore'
import { useOllamaModels } from './hooks/useOllamaModels'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'
import type { OllamaConfig } from '@/shared/types'

export function SettingsView() {
  const { ollama, setOllama } = useSettingsStore()
  const { models, loading, error, testConnection } = useOllamaModels()

  const { register, handleSubmit } = useForm<OllamaConfig>({ defaultValues: ollama })

  const onSave = (data: OllamaConfig) => {
    setOllama({ ...data, port: Number(data.port) })
    toast.success('Configuración guardada')
  }

  return (
    <div className="max-w-lg space-y-6">
      <h2 className="text-lg font-semibold">Configuración de Ollama</h2>

      <form onSubmit={handleSubmit(onSave)} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="url">URL</label>
          <input
            id="url"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register('url', { required: true })}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="port">Puerto</label>
          <input
            id="port"
            type="number"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register('port', { required: true, valueAsNumber: true })}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="model">Modelo</label>
          <input
            id="model"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register('model', { required: true })}
          />
          {models.length > 0 && (
            <ul className="mt-1 space-y-1">
              {models.map((m) => (
                <li key={m.name} className="text-xs text-muted-foreground">
                  {m.name}
                </li>
              ))}
            </ul>
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

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </form>
    </div>
  )
}
