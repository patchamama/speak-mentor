import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useSettingsStore, DEFAULT_MODEL_PARAMS } from '@/stores/settingsStore'
import { useOllamaModels } from './hooks/useOllamaModels'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'
import type { OllamaConfig, ModelParams, CorrectionPassId } from '@/shared/types'

const DEFAULT_MODEL = 'translategemma:12b'

type SettingsTab = 'connection' | 'params' | 'pipeline' | 'prompts' | 'terminal'

const TAB_LABELS: Record<SettingsTab, string> = {
  connection: 'Conexión',
  params: 'Parámetros',
  pipeline: 'Pipeline',
  prompts: 'Prompts',
  terminal: 'Terminal',
}

const PASS_INFO: Record<CorrectionPassId, { label: string; description: string }> = {
  correction: {
    label: 'Corrección gramatical',
    description: 'Detecta y explica errores en el texto. Siempre activo.',
  },
  vocabulary: {
    label: 'Vocabulario enriquecido',
    description: 'Genera fichas de vocabulario con info gramatical completa (género, plural, conjugación irregular, verbos separables).',
  },
  exercises: {
    label: 'Ejercicios personalizados',
    description: 'Crea ~10 ejercicios dirigidos exactamente a los tipos de errores encontrados en el texto.',
  },
}

const inputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function SettingsView() {
  const { ollama, setOllama, modelParams, setModelParams, prompts, setPrompts, resetPrompts, pipeline, setPipeline } =
    useSettingsStore()
  const { models, loading, error, testConnection } = useOllamaModels()
  const [tab, setTab] = useState<SettingsTab>('connection')

  // ── Connection form ────────────────────────────────────────────────────────
  const { register: regConn, handleSubmit: handleConn, setValue } = useForm<OllamaConfig>({
    defaultValues: ollama,
  })
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
  type PromptTabId = 'correction' | 'translation' | 'vocabulary' | 'exercises'
  const [promptTab, setPromptTab] = useState<PromptTabId>('correction')
  const [drafts, setDrafts] = useState({
    correction: prompts.correctionSystem,
    translation: prompts.translationSystem,
    vocabulary: prompts.vocabularySystem,
    exercises: prompts.exercisesSystem,
  })

  const setDraft = (tab: PromptTabId, value: string) =>
    setDrafts((d) => ({ ...d, [tab]: value }))

  const PROMPT_TAB_LABELS: Record<PromptTabId, string> = {
    correction: 'Corrección',
    translation: 'Traducción',
    vocabulary: 'Vocabulario',
    exercises: 'Ejercicios',
  }

  const PROMPT_TAB_VARS: Record<PromptTabId, string> = {
    correction: '{{LEVEL}}, {{EXPLANATION_LANG}}, {{EXPLANATION_LANG_FULL}}',
    translation: '{{LEVEL}}, {{SOURCE_LANG}}, {{TARGET_LANG}}, {{EXPLANATION_LANG}}, {{EXPLANATION_LANG_FULL}}',
    vocabulary: '{{LEVEL}}, {{EXPLANATION_LANG}}, {{EXPLANATION_LANG_FULL}}',
    exercises: '{{LEVEL}}, {{EXPLANATION_LANG}}, {{EXPLANATION_LANG_FULL}}',
  }

  const onSavePrompts = () => {
    setPrompts({
      correctionSystem: drafts.correction,
      translationSystem: drafts.translation,
      vocabularySystem: drafts.vocabulary,
      exercisesSystem: drafts.exercises,
    })
    toast.success('Prompts guardados')
  }

  const onResetPrompts = () => {
    resetPrompts()
    const defaults = useSettingsStore.getState().prompts
    setDrafts({
      correction: defaults.correctionSystem,
      translation: defaults.translationSystem,
      vocabulary: defaults.vocabularySystem,
      exercises: defaults.exercisesSystem,
    })
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

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="keepAlive">
              Keep-alive del modelo
            </label>
            <select id="keepAlive" className={inputClass} {...regConn('keepAlive', { valueAsNumber: true })}>
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

      {/* ── Pipeline ────────────────────────────────────────────────────────── */}
      {tab === 'pipeline' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-1">Pasadas de análisis</h3>
            <p className="text-xs text-muted-foreground">
              Cada pasada lanza un prompt separado. Los resultados aparecen en tiempo real a medida
              que se completan. La corrección siempre es la primera pasada.
            </p>
          </div>
          <div className="space-y-3">
            {(['correction', 'vocabulary', 'exercises'] as CorrectionPassId[]).map((passId) => {
              const info = PASS_INFO[passId]
              const isCore = passId === 'correction'
              const isActive = pipeline.passes.includes(passId)
              return (
                <div
                  key={passId}
                  className="flex items-start gap-4 rounded-lg border p-4 bg-card"
                >
                  <input
                    type="checkbox"
                    id={`pass-${passId}`}
                    checked={isActive}
                    disabled={isCore}
                    onChange={(e) => {
                      if (isCore) return
                      const next = e.target.checked
                        ? [...pipeline.passes, passId]
                        : pipeline.passes.filter((p) => p !== passId)
                      setPipeline({ passes: next })
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-border"
                    aria-label={info.label}
                  />
                  <label htmlFor={`pass-${passId}`} className="space-y-0.5 cursor-pointer flex-1">
                    <p className="text-sm font-medium">
                      {info.label}
                      {isCore && (
                        <span className="ml-2 text-xs text-muted-foreground">(siempre activo)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{info.description}</p>
                  </label>
                </div>
              )
            })}
          </div>
          <div className="rounded-md bg-muted px-4 py-3 text-xs text-muted-foreground space-y-1">
            <p>⏱ Cada pasada adicional agrega ~30-90s dependiendo del modelo y el texto.</p>
            <p>El vocabulario usa el texto <em>corregido</em> como entrada.</p>
            <p>Los ejercicios solo se generan si hubo errores en la corrección.</p>
          </div>
        </div>
      )}

      {/* ── Terminal ────────────────────────────────────────────────────────── */}
      {tab === 'terminal' && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Ollama debe iniciarse con <code className="bg-muted px-1 rounded text-xs">OLLAMA_ORIGINS=*</code> para
            permitir peticiones desde el navegador. El comando recomendado incluye optimizaciones de rendimiento.
          </p>

          {/* Comandos por OS */}
          {([
            {
              os: 'macOS / Linux',
              kill: 'pkill -f ollama',
              runBasic: 'OLLAMA_HOST=0.0.0.0:11434 OLLAMA_ORIGINS="*" ollama serve',
              runFull: 'OLLAMA_HOST=0.0.0.0:11434 \\\nOLLAMA_ORIGINS="*" \\\nOLLAMA_FLASH_ATTENTION=1 \\\nOLLAMA_KV_CACHE_TYPE=q8_0 \\\nOLLAMA_NUM_PARALLEL=2 \\\nOLLAMA_KEEP_ALIVE=-1 \\\nollama serve',
            },
            {
              os: 'Windows (PowerShell)',
              kill: 'Stop-Process -Name "ollama" -Force -ErrorAction SilentlyContinue',
              runBasic: '$env:OLLAMA_HOST="0.0.0.0:11434"; $env:OLLAMA_ORIGINS="*"; ollama serve',
              runFull: '$env:OLLAMA_HOST="0.0.0.0:11434"\n$env:OLLAMA_ORIGINS="*"\n$env:OLLAMA_FLASH_ATTENTION="1"\n$env:OLLAMA_KV_CACHE_TYPE="q8_0"\n$env:OLLAMA_NUM_PARALLEL="2"\n$env:OLLAMA_KEEP_ALIVE="-1"\nollama serve',
            },
            {
              os: 'Windows (CMD)',
              kill: 'taskkill /F /IM ollama.exe 2>nul',
              runBasic: 'set OLLAMA_HOST=0.0.0.0:11434 && set OLLAMA_ORIGINS=* && ollama serve',
              runFull: 'set OLLAMA_HOST=0.0.0.0:11434 && set OLLAMA_ORIGINS=* && set OLLAMA_FLASH_ATTENTION=1 && set OLLAMA_KV_CACHE_TYPE=q8_0 && set OLLAMA_NUM_PARALLEL=2 && set OLLAMA_KEEP_ALIVE=-1 && ollama serve',
            },
          ] as const).map(({ os, kill, runBasic, runFull }) => (
            <div key={os} className="rounded-lg border p-4 space-y-3">
              <p className="text-sm font-semibold">{os}</p>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">1. Detener instancia previa</p>
                <pre className="text-xs bg-muted rounded-md px-3 py-2 overflow-x-auto select-all">{kill}</pre>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">2. Mínimo (solo CORS)</p>
                <pre className="text-xs bg-muted rounded-md px-3 py-2 overflow-x-auto select-all">{runBasic}</pre>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">3. Recomendado (rendimiento óptimo)</p>
                <pre className="text-xs bg-muted rounded-md px-3 py-2 overflow-x-auto select-all">{runFull}</pre>
              </div>
            </div>
          ))}

          {/* Variables de entorno */}
          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-sm font-semibold">Variables de entorno — referencia</p>
            <div className="space-y-2 text-xs">
              {([
                { name: 'OLLAMA_ORIGINS', value: '"*"', desc: 'CORS — permite peticiones desde el navegador' },
                { name: 'OLLAMA_KEEP_ALIVE', value: '-1', desc: 'Mantiene el modelo en VRAM indefinidamente (evita recargas entre passes)' },
                { name: 'OLLAMA_KV_CACHE_TYPE', value: 'q8_0', desc: '50% menos VRAM con mínima pérdida de calidad. Requiere Flash Attention' },
                { name: 'OLLAMA_FLASH_ATTENTION', value: '1', desc: 'Activa Flash Attention (Apple Silicon, NVIDIA Pascal+, AMD ROCm)' },
                { name: 'OLLAMA_NUM_PARALLEL', value: '2', desc: 'Requests concurrentes al mismo modelo sin descargarlo' },
                { name: 'OLLAMA_MAX_LOADED_MODELS', value: '1', desc: 'Modelos simultáneos en VRAM (reducir si hay poca memoria)' },
              ] as const).map(({ name, value, desc }) => (
                <div key={name} className="grid grid-cols-[auto_auto_1fr] gap-x-3 items-start">
                  <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-foreground">{name}</code>
                  <code className="bg-primary/10 px-1.5 py-0.5 rounded font-mono text-primary">{value}</code>
                  <span className="text-muted-foreground pt-0.5">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Verificar */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <p className="text-sm font-medium">Verificar que funciona</p>
            <div className="space-y-1">
              <pre className="text-xs text-muted-foreground overflow-x-auto select-all">curl http://localhost:11434/api/tags</pre>
              <pre className="text-xs text-muted-foreground overflow-x-auto select-all">curl http://localhost:11434/api/ps</pre>
            </div>
            <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 rounded">/api/tags</code> lista modelos instalados · <code className="bg-muted px-1 rounded">/api/ps</code> muestra el modelo actualmente cargado en VRAM.</p>
          </div>

          <div className="border-t pt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span>Código fuente:</span>
            <a
              href="https://github.com/patchamama/speak-mentor"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:underline font-medium"
            >
              github.com/patchamama/speak-mentor
            </a>
          </div>
        </div>
      )}

      {/* ── Prompts ─────────────────────────────────────────────────────────── */}
      {tab === 'prompts' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1">
            {(Object.keys(PROMPT_TAB_LABELS) as PromptTabId[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPromptTab(p)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  promptTab === p ? 'bg-muted font-medium' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {PROMPT_TAB_LABELS[p]}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Variables disponibles: <code className="bg-muted px-1 rounded">{PROMPT_TAB_VARS[promptTab]}</code>
            </p>
            <textarea
              key={promptTab}
              className="w-full min-h-[360px] rounded-md border border-input bg-background px-3 py-2 text-xs font-mono resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={drafts[promptTab]}
              onChange={(e) => setDraft(promptTab, e.target.value)}
              spellCheck={false}
              aria-label={`Prompt de ${PROMPT_TAB_LABELS[promptTab]}`}
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
