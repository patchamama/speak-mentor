# Speak Mentor

> A local-first German language tutor powered by Ollama.

Write German, get inline CEFR-aware corrections with color-coded error highlighting, multi-pass vocabulary enrichment, personalized exercises, translate between German and Spanish, and learn from curated examples of the most common German errors for Spanish speakers — all running on your own machine. No cloud APIs, no telemetry, no subscriptions.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Features

| Feature | Details |
|---|---|
| **Correction pipeline (DE→DE)** | 3-pass pipeline: grammar correction → vocabulary cards → targeted exercises |
| **Error highlighting** | Inline color-coded spans by error type (case, gender, word order, separable verbs…) |
| **CEFR assessment** | Detected level, target level, gap notes — for every submission |
| **Vocabulary enrichment** | ~10 grammar cards per text with full verb/noun/adjective morphology |
| **Targeted exercises** | ~10 multiple-choice exercises targeting only the error types found |
| **Correction verification** | Automatic second pass to confirm the corrected text has no residual errors |
| **Translation (DE↔ES)** | Level-adapted translation with vocabulary notes, grammar notes, register alternatives |
| **Common errors** | 15 categories, 55 curated examples of the most frequent mistakes for Spanish speakers |
| **History & Stats** | Paginated session history, error breakdowns by type / level / timeline, JSON export |
| **Settings** | Ollama URL, port, model, keep-alive, temperature, context window, per-pass prompt editor |
| **Pipeline control** | Toggle advanced mode (all 3 passes) vs simple (correction only) per submission |
| **Dark mode** | Persisted to `localStorage` |
| **Keyboard shortcut** | `Cmd+Enter` / `Ctrl+Enter` to submit |

---

## Architecture

### How the pipeline works

```
User text
    │
    ▼
┌─────────────────────────────┐
│  Pass 1 — Grammar Correction │  → corrected text + error list + CEFR assessment
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│  Pass 1.5 — Verification     │  → confirms corrected text is error-free; auto-fixes if not
└─────────────────────────────┘
    │
    ├──────────────────────────────────────────────────┐
    ▼                                                  ▼
┌──────────────────────────┐          ┌──────────────────────────────┐
│  Pass 2 — Vocabulary     │          │  Pass 3 — Exercises           │
│  ~10 grammar cards from  │          │  ~10 multiple-choice exercises│
│  original + corrected    │          │  targeting only error types   │
│  text                    │          │  found in Pass 1              │
└──────────────────────────┘          └──────────────────────────────┘
```

Passes 2 and 3 run sequentially after Pass 1.5. Results appear progressively in the UI as each pass completes. The model is kept in VRAM between passes using `keep_alive: -1`.

### Frontend structure

```
frontend/src/
├── features/
│   ├── correction/         # Pipeline hook, error highlight, vocabulary panel, exercises panel
│   ├── translation/        # DE↔ES translation
│   ├── common-errors/      # 15 error categories × curated examples
│   ├── history/            # Session history & stats charts
│   └── settings/           # Ollama config, model params, pipeline, prompts, terminal
├── shared/
│   ├── ollama/             # Prompt builder, Zod schemas, Ollama client, templates
│   ├── api/                # Flask REST client
│   ├── hooks/              # Shared hooks (input history, elapsed timer)
│   ├── ui/                 # Button, Spinner, LevelSelector, Skeleton…
│   └── types/              # Shared TypeScript types
├── stores/                 # Zustand stores (settings with persist + migrate)
└── components/             # ErrorBoundary
```

**Scope rule:** components used by 2+ features live in `shared/`. Single-feature components stay local to their feature folder.

---

## Tech Stack

### Frontend

| Technology | Version | Role |
|---|---|---|
| [React](https://react.dev) | 19.x | UI framework |
| [TypeScript](https://www.typescriptlang.org) | 5.x | Type safety |
| [Vite](https://vitejs.dev) | 5.x | Dev server & bundler |
| [Tailwind CSS](https://tailwindcss.com) | 3.x | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com) + Radix UI | — | Accessible component primitives |
| [Zustand](https://zustand-demo.pmnd.rs) | 4.x | Client state (settings, theme) with `persist` + `migrate` |
| [TanStack Query](https://tanstack.com/query) | 5.x | Server state & caching |
| [Zod](https://zod.dev) | 3.x | LLM response validation + error type normalization |
| [ky](https://github.com/sindresorhus/ky) | 1.x | HTTP client |
| [react-hook-form](https://react-hook-form.com) | 7.x | Form management |
| [Recharts](https://recharts.org) | 2.x | Stats charts |
| [Sonner](https://sonner.emilkowal.ski) | 1.x | Toast notifications |
| [Vitest](https://vitest.dev) + [RTL](https://testing-library.com/react) | — | Unit & component tests |

### Backend

| Technology | Version | Role |
|---|---|---|
| [Python](https://python.org) | ≥ 3.11 | Runtime |
| [Flask](https://flask.palletsprojects.com) | ≥ 3.1 | REST API |
| [SQLAlchemy](https://www.sqlalchemy.org) | ≥ 2.0 | ORM |
| [Alembic](https://alembic.sqlalchemy.org) | ≥ 1.14 | Schema migrations |
| [flask-cors](https://flask-cors.readthedocs.io) | ≥ 5.0 | CORS headers |
| [pytest](https://pytest.org) | ≥ 8.2 | Test suite |
| SQLite | bundled | Local database |

### LLM

| | |
|---|---|
| **Runtime** | [Ollama](https://ollama.com) — called **directly from the browser** (no backend proxy) |
| **Default model** | `translategemma:12b` |
| **Supported** | Any model installed in Ollama |
| **Protocol** | `POST /api/chat` with `format: "json"` and `keep_alive: -1` |
| **Validation** | Zod schemas with alias map for model-hallucinated error types |

---

## Prerequisites

- **Node.js** ≥ 20 — [nodejs.org](https://nodejs.org)
- **Python** ≥ 3.11 — [python.org](https://python.org)
- **Ollama** — [ollama.com](https://ollama.com)
- A model pulled: `ollama pull translategemma:12b`

---

## Getting Started

### 1. Clone

```bash
git clone https://github.com/patchamama/speak-mentor.git
cd speak-mentor
```

### 2. Start Ollama

Use the included script (auto-detects hardware, applies performance optimizations):

```bash
./start-ollama.sh
```

Or manually with the minimum required flags:

```bash
# macOS / Linux
pkill -f ollama 2>/dev/null || true
OLLAMA_HOST=0.0.0.0:11434 OLLAMA_ORIGINS="*" OLLAMA_KEEP_ALIVE=-1 ollama serve
```

See [Ollama Performance](#ollama-performance) for the full reference.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App available at `http://localhost:5173`.

### 4. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
flask --app wsgi:app run --port 5001
```

API available at `http://localhost:5001/api`.  
SQLite database is created automatically at `backend/instance/speak_mentor.db` on first run.

> **macOS note:** port 5000 is occupied by AirPlay Receiver. The backend uses **5001**.

### 5. Convenience scripts

```bash
./start-ollama.sh       # Ollama with performance optimizations
./start-backend.sh      # Flask backend
./start-frontend.sh     # Vite dev server
```

---

## Ollama Performance

The full guide is at [`docs/ollama-performance.md`](docs/ollama-performance.md). Quick reference:

### Recommended startup (macOS / Linux)

```bash
pkill -f ollama 2>/dev/null || true
OLLAMA_HOST=0.0.0.0:11434 \
OLLAMA_ORIGINS="*" \
OLLAMA_KEEP_ALIVE=-1 \
OLLAMA_FLASH_ATTENTION=1 \
OLLAMA_KV_CACHE_TYPE=q8_0 \
OLLAMA_NUM_PARALLEL=2 \
ollama serve
```

### Recommended startup (Windows — PowerShell)

```powershell
Stop-Process -Name "ollama" -Force -ErrorAction SilentlyContinue
$env:OLLAMA_HOST="0.0.0.0:11434"
$env:OLLAMA_ORIGINS="*"
$env:OLLAMA_KEEP_ALIVE="-1"
$env:OLLAMA_FLASH_ATTENTION="1"
$env:OLLAMA_KV_CACHE_TYPE="q8_0"
$env:OLLAMA_NUM_PARALLEL="2"
ollama serve
```

### Recommended startup (Windows — CMD)

```cmd
taskkill /F /IM ollama.exe 2>nul
set OLLAMA_HOST=0.0.0.0:11434 && set OLLAMA_ORIGINS=* && set OLLAMA_KEEP_ALIVE=-1 && set OLLAMA_FLASH_ATTENTION=1 && set OLLAMA_KV_CACHE_TYPE=q8_0 && set OLLAMA_NUM_PARALLEL=2 && ollama serve
```

### Key environment variables

| Variable | Recommended | Effect |
|---|---|---|
| `OLLAMA_KEEP_ALIVE` | `-1` | Model stays in VRAM indefinitely — no reloads between pipeline passes |
| `OLLAMA_KV_CACHE_TYPE` | `q8_0` | 50% less VRAM, minimal quality loss. Requires Flash Attention |
| `OLLAMA_FLASH_ATTENTION` | `1` | Enable Flash Attention (Apple Silicon, NVIDIA Pascal+, AMD ROCm) |
| `OLLAMA_NUM_PARALLEL` | `2` | Concurrent requests without reloading the model |
| `OLLAMA_ORIGINS` | `*` | Required for browser → Ollama requests |

### Verify it works

```bash
curl http://localhost:11434/api/tags   # list installed models
curl http://localhost:11434/api/ps     # show model currently loaded in VRAM
```

---

## Running Tests

```bash
# Frontend — Vitest
cd frontend && npm test

# Backend — pytest
cd backend && pytest
```

---

## API Reference

Base URL: `http://localhost:5001/api`

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness check |
| `POST` | `/sessions` | Save a session and its errors |
| `GET` | `/sessions` | List sessions (paginated, filterable by mode) |
| `GET` | `/sessions/:id` | Get a session with all errors |
| `DELETE` | `/sessions/:id` | Delete session (cascades to errors) |
| `GET` | `/errors` | List errors (filterable) |
| `GET` | `/stats/by-type` | Error count per type |
| `GET` | `/stats/by-level` | Error count per CEFR level |
| `GET` | `/stats/timeline?days=30` | Daily error counts, last N days |
| `GET` | `/stats/top-rules?limit=10` | Most broken grammar rules |

---

## Settings Reference

All settings are persisted in `localStorage` under `speak-mentor-settings`.

| Setting | Default | Description |
|---|---|---|
| Ollama URL | `http://localhost` | Ollama host |
| Port | `11434` | Ollama port |
| Model | `translategemma:12b` | Active model (auto-detected from installed models) |
| Keep-alive | `-1` (indefinite) | How long the model stays in VRAM after the last request |
| Temperature | `0.2` | 0 = deterministic, 1 = creative |
| Top P | `0.9` | Sampling diversity |
| Context (tokens) | `4096` | Model context window |
| Timeout | `300s` | Max wait per request |
| Pipeline passes | all 3 on | Correction (always) + Vocabulary + Exercises |
| System prompts | built-in | Editable per pass: correction, translation, vocabulary, exercises |

---

## Environment Variables

### Backend

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///speak_mentor.db` | SQLAlchemy connection string |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:5174` | Allowed origins |
| `SECRET_KEY` | `dev-secret-key` | Flask secret key |

### Ollama

| Variable | Description |
|---|---|
| `OLLAMA_HOST` | Bind address, e.g. `0.0.0.0:11434` |
| `OLLAMA_ORIGINS` | Origins allowed to call Ollama from the browser |
| `OLLAMA_KEEP_ALIVE` | VRAM retention time (`-1` = indefinite) |
| `OLLAMA_KV_CACHE_TYPE` | KV cache quantization (`f16`, `q8_0`, `q4_0`) |
| `OLLAMA_FLASH_ATTENTION` | Enable Flash Attention (`1` / `0`) |
| `OLLAMA_NUM_PARALLEL` | Max concurrent requests per model |

---

## Known Limitations

- **No router** — navigation via `useState`; browser back/forward and deep links don't work.
- **No abort button** — no way to cancel an in-flight request other than waiting for the timeout.
- **No E2E tests** — Playwright / Cypress not set up.
- **No CI pipeline** — `npm run lint` and `pytest` must be run manually.
- **Mobile layout** — not tested.

---

## Roadmap

- Spaced repetition for top broken grammar rules
- TTS audio for corrected sentences
- Abort button for in-flight requests
- React Router for deep linking
- Cloud LLM option (OpenAI, Anthropic)
- Multi-user accounts

---

## Documentation

| File | Content |
|---|---|
| [`docs/ollama-performance.md`](docs/ollama-performance.md) | Full Ollama optimization guide (KV cache, Flash Attention, keep_alive, hardware profiles) |
| [`docs/prompt-research.md`](docs/prompt-research.md) | Prompt engineering research: error taxonomy, test results, v1→v3 improvements |
| [`PLAN.md`](PLAN.md) | Original development plan and epic breakdown |
| [`DECISIONS.md`](DECISIONS.md) | Architecture decisions log |

---

## Privacy

All data stays on your machine. The app calls Ollama on `localhost`. The Flask backend writes only to a local SQLite file. No analytics, no external requests of any kind.

---

## Contributing

Issues and PRs welcome at [github.com/patchamama/speak-mentor](https://github.com/patchamama/speak-mentor).

---

## License

[MIT](LICENSE)
