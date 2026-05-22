import { useOllamaActivityStore } from '@/stores/ollamaActivityStore'

// Global serialization queue shared by every LLM provider.
// Local Ollama needs strict serialization (single model in VRAM); remote
// providers also benefit from sequencing to keep pipeline order deterministic.

interface QueueItem {
  run: () => Promise<string>
  resolve: (value: string) => void
  reject: (reason: unknown) => void
}

const _queue: QueueItem[] = []
let _running = false

function _drain() {
  if (_running || _queue.length === 0) return
  const item = _queue.shift()!
  _running = true
  useOllamaActivityStore.getState().setBusy(true)
  item.run().then(item.resolve, item.reject).finally(() => {
    _running = false
    if (_queue.length === 0) useOllamaActivityStore.getState().setBusy(false)
    _drain()
  })
}

export function enqueue(run: () => Promise<string>): Promise<string> {
  return new Promise((resolve, reject) => {
    _queue.push({ run, resolve, reject })
    _drain()
  })
}

export function getQueueLength(): number {
  return _queue.length + (_running ? 1 : 0)
}
