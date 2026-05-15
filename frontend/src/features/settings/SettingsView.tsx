import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useSettingsStore, DEFAULT_MODEL_PARAMS } from '@/stores/settingsStore'
import { useOllamaModels } from './hooks/useOllamaModels'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'
import type { OllamaConfig, ModelParams } from '@/shared/types'

const DEFAULT_MODEL = 'translategemma:12b'

type SettingsTab = 'connection' | 'params' | 'prompts' | 'terminal'

const TAB_LABELS: Record<SettingsTab, string> = {
  connection: 'Conexión',
  params: 'Parámetros',
  prompts: 'Prompts',
  terminal: 'Terminal',
}

const inputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function SettingsView() {
  const { ollama, setOllama, modelParams, setModelParams, prompts, setPrompts, resetPrompts } =
    useSettingsStore()
  const { models, loading, error, testConnection } = useOllamaModels()
  const [tab, setTab] = useState<SettingsTab>('connection')

  // ── Connection form ────────────────────────────────────────────────────────
  const { register: regConn, handleSubmit: handleConn, setValue } = useForm<OllamaConfig>({
    defaultValues: ollama,
  })
  const selectedModel = useForm<OllamaConfig>({ defaultValues: ollama }).watch?.('model') ?? ollama.model

  useEffect(() => {
    if (models.length === 0) return
    const currentIsListed = models.some((m) => m.name === ollama.model)
    if (!currentIsListed) setValue('model', DEFAULT_MODEL)
  }, [models, ollama.model, setValue])

  const onSaveConnection = (data: OllamaConfig) => {
    setOllama({ ...data, port: Number(data.port) })
    toast.success('Configuración guardada')
  }

  // ── Params form ────────────────────────────────────────────────────────────
  const { register: regParams, handleSubmit: handleParams } = useForm<ModelParams>({
    defaultValues: modelParams,
  })

  const onSaveParams = (data: ModelParams) => {
    setModelParams({
      temperature: Number(data.temperature),
      top_p: Number(data.top_p),
      num_ctx: Number(data.num_ctx),
      timeout: Number(data.timeout),
    })
    toast.success('Parámetros guardados')
  }

  // ── Prompts ────────────────────────────────────────────────────────────────
  const [correctionDraft, setCorrectionDraft] = useState(prompts.correctionSystem)
  const [translationDraft, setTranslationDraft] = useState(prompts.translationSystem)
  const [promptTab, setPromptTab] = useState<'correction' | 'translation'>('correction')

  const onSavePrompts = () => {
    setPrompts({ correctionSystem: correctionDraft, translationSystem: translationDraft })
    toast.success('Prompts guardados')
  }

  const onResetPrompts = () => {
    resetPrompts()
    const defaults = useSettingsStore.getState().prompts
    setCorrectionDraft(defaults.correctionSystem)
    setTranslationDraft(defaults.translationSystem)
    toast.success('Prompts restablecidos')
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-lg font-semibold">Configuración</h2>

      {/* Tab selector */}
      <div className="flex gap-1 border-b pb-0">
        {(Object.keys(TAB_LABELS) as SettingsTab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* ── Connection ──────────────────────────────────────────────────────── */}
      {tab === 'connection' && (
        <form onSubmit={handleConn(onSaveConnection)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="url">URL</label>
            <input id="url" className={inputClass} {...regConn('url', { required: true })} />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="port">Puerto</label>
            <input
              id="port"
              type="number"
              className={inputClass}
              {...regConn('port', { required: true, valueAsNumber: true })}
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
              <select id="model" className={inputClass} {...regConn('model', { required: true })}>
                {[...models].sort((a, b) => a.name.localeCompare(b.name)).map((m) => (
                  <option key={m.name} value={m.name}>{m.name}</option>
                ))}
              </select>
            ) : (
              <input
                id="model"
                className={inputClass}
                placeholder={DEFAULT_MODEL}
                {...regConn('model', { required: true })}
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
            <Button type="button" variant="outline" onClick={testConnection} disabled={loading}>
              {loading ? <Spinner className="mr-2" /> : null}
              Probar conexión
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      )}

      {/* ── Model params ────────────────────────────────────────────────────── */}
      {tab === 'params' && (
        <form onSubmit={handleParams(onSaveParams)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="temperature">
                Temperature
              </label>
              <p className="text-xs text-muted-foreground">0 = determinístico · 1 = creativo</p>
              <input
                id="temperature"
                type="number"
                step="0.05"
                min="0"
                max="1"
                className={inputClass}
                {...regParams('temperature', { required: true, valueAsNumber: true })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="top_p">Top P</label>
              <p className="text-xs text-muted-foreground">Diversidad del muestreo</p>
              <input
                id="top_p"
                type="number"
                step="0.05"
                min="0"
                max="1"
                className={inputClass}
                {...regParams('top_p', { required: true, valueAsNumber: true })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="num_ctx">Contexto (tokens)</label>
              <p className="text-xs text-muted-foreground">Ventana de contexto del modelo</p>
              <input
                id="num_ctx"
                type="number"
                step="512"
                min="512"
                className={inputClass}
                {...regParams('num_ctx', { required: true, valueAsNumber: true })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="timeout">
                Timeout (segundos)
              </label>
              <p className="text-xs text-muted-foreground">Tiempo máximo de espera</p>
              <input
                id="timeout"
                type="number"
                step="30"
                min="30"
                className={inputClass}
                defaultValue={modelParams.timeout / 1000}
                {...regParams('timeout', {
                  required: true,
                  valueAsNumber: true,
                  setValueAs: (v) => Number(v) * 1000,
                })}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit">Guardar</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setModelParams(DEFAULT_MODEL_PARAMS)
                toast.success('Parámetros restablecidos')
              }}
            >
              Restablecer
            </Button>
          </div>
        </form>
      )}

      {/* ── Terminal ────────────────────────────────────────────────────────── */}
      {tab === 'terminal' && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Ollama debe iniciarse con <code className="bg-muted px-1 rounded text-xs">OLLAMA_ORIGINS=*</code> para
            permitir peticiones desde el navegador. Usá los comandos de tu sistema operativo.
          </p>

          {([
            {
              os: 'macOS',
              icon: '',
              kill: 'pkill -f ollama',
              run: 'OLLAMA_HOST=0.0.0.0:11434 OLLAMA_ORIGINS="*" ollama serve',
            },
            {
              os: 'Linux',
              icon: '',
              kill: 'pkill -f ollama',
              run: 'OLLAMA_HOST=0.0.0.0:11434 OLLAMA_ORIGINS="*" ollama serve',
            },
            {
              os: 'Windows (PowerShell)',
              icon: '',
              kill: 'Stop-Process -Name "ollama" -Force -ErrorAction SilentlyContinue',
              run: '$env:OLLAMA_HOST="0.0.0.0:11434"; $env:OLLAMA_ORIGINS="*"; ollama serve',
            },
            {
              os: 'Windows (CMD)',
              icon: '',
              kill: 'taskkill /F /IM ollama.exe 2>nul',
              run: 'set OLLAMA_HOST=0.0.0.0:11434 && set OLLAMA_ORIGINS=* && ollama serve',
            },
          ] as const).map(({ os, kill, run }) => (
            <div key={os} className="rounded-lg border p-4 space-y-3">
              <p className="text-sm font-semibold">{os}</p>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">1. Detener instancia previa</p>
                <pre className="text-xs bg-muted rounded-md px-3 py-2 overflow-x-auto select-all">{kill}</pre>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">2. Iniciar con CORS habilitado</p>
                <pre className="text-xs bg-muted rounded-md px-3 py-2 overflow-x-auto select-all">{run}</pre>
              </div>
            </div>
          ))}

          <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-1">
            <p className="font-medium">Verificar que funciona</p>
            <pre className="text-xs text-muted-foreground overflow-x-auto select-all">curl http://localhost:11434/api/tags</pre>
            <p className="text-xs text-muted-foreground">Debe devolver un JSON con los modelos instalados.</p>
          </div>

          <div className="border-t pt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span>Código fuente:</span>
            <a
              href="https://github.com/mandymozart/speak-mentor"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:underline font-medium"
            >
              github.com/mandymozart/speak-mentor
            </a>
          </div>
        </div>
      )}

      {/* ── Prompts ─────────────────────────────────────────────────────────── */}
      {tab === 'prompts' && (
        <div className="space-y-4">
          <div className="flex gap-1">
            {(['correction', 'translation'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPromptTab(p)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  promptTab === p ? 'bg-muted font-medium' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p === 'correction' ? 'Corrección' : 'Traducción'}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Variables disponibles:{' '}
              {promptTab === 'correction'
                ? '{{LEVEL}}, {{EXPLANATION_LANG}}, {{EXPLANATION_LANG_FULL}}'
                : '{{LEVEL}}, {{SOURCE_LANG}}, {{TARGET_LANG}}, {{EXPLANATION_LANG}}, {{EXPLANATION_LANG_FULL}}'}
            </p>
            <textarea
              className="w-full min-h-[360px] rounded-md border border-input bg-background px-3 py-2 text-xs font-mono resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={promptTab === 'correction' ? correctionDraft : translationDraft}
              onChange={(e) =>
                promptTab === 'correction'
                  ? setCorrectionDraft(e.target.value)
                  : setTranslationDraft(e.target.value)
              }
              spellCheck={false}
            />
          </div>

          <div className="flex gap-3">
            <Button onClick={onSavePrompts}>Guardar</Button>
            <Button variant="outline" onClick={onResetPrompts}>
              Restablecer original
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
