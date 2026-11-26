# Speak Mentor

**Live demo:** https://tinyurl.com/25ta34jd &nbsp;|&nbsp; https://patchamama.github.io/speak-mentor/

> A local-first German language tutor with pluggable LLM backends — Ollama by default, optional Anthropic / Google Gemini / OpenAI.

Write German, get inline CEFR-aware corrections with color-coded error highlighting, multi-pass vocabulary enrichment, personalized exercises, translate between German and Spanish, and learn from curated examples of the most common German errors for Spanish speakers. Ollama runs entirely on your own machine; remote providers are opt-in and gated behind an encrypted master password (or a server-side proxy that keeps the API key off the browser). No telemetry, no subscriptions.

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
| **Multi-provider LLM** | Ollama (local), Anthropic, Google Gemini, OpenAI — pick per session in Settings |
| **Encrypted API keys** | Remote keys cifrados con PBKDF2-SHA256 + AES-GCM-256; contraseña maestra solo en memoria |
| **Works without backend** | History and stats are stored in the browser or as a JSON file in a GitHub repository |
| **Backend proxy** | Optional Flask `/api/llm/*` proxy keeps keys in server env vars instead of the browser |
| **Settings** | Provider picker, model dropdown per provider, manual model override, prompt editor, per-pass pipeline, model params |
| **Pipeline control** | Toggle advanced mode (all 3 passes) vs simple (correction only) per submission |
| **Spanish and German UI** | Language selector in the header; AI explanations and the common-errors content follow it. UI text lives in `frontend/src/i18n` and tests fail on missing translations |
| **Provider billing links** | API key, balance/top-up and usage pages for OpenAI, Anthropic and Gemini |
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

### LLM providers

The frontend talks to a small `LLMProvider` interface (`chat`, `listModels`). Each provider is a thin adapter:

| Provider | Default mode | Notes |
|---|---|---|
| [Ollama](https://ollama.com) | Browser → `localhost:11434` | No credentials. Default. Recommended model: `translategemma:12b`. |
| [Anthropic](https://docs.anthropic.com) | Browser → `api.anthropic.com` (direct) | Uses `anthropic-dangerous-direct-browser-access: true`. Switch to backend proxy any time. |
| [Google Gemini](https://ai.google.dev) | Browser → `generativelanguage.googleapis.com` (direct) | Key passed as `?key=` query param. Switch to backend proxy any time. |
| [OpenAI](https://platform.openai.com) | Browser → `api.openai.com` (direct) | Retries without sampling params for models that reject them. Switch to backend model any time. |

**Key storage**:
- Ollama: no key, no storage.
- Anthropic / Gemini / OpenAI (direct mode): API key encrypted in `localStorage` with PBKDF2-SHA256 (600k iterations) + AES-GCM-256. The derived key lives only in memory; closing the tab re-locks it.
- Backend model (optional): the API key is read from server env vars (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`); the frontend never sees it.

**Validation**: Zod schemas with alias map for model-hallucinated error types. JSON enforced via `format: "json"` (Ollama), `response_format: {type: "json_object"}` (OpenAI), `responseMimeType: "application/json"` (Gemini), or system-prompt reinforcement (Anthropic). Auto-retry once at `temperature=0` on schema failure.

---

## Prerequisites

- **Node.js** ≥ 20 — [nodejs.org](https://nodejs.org)
- **Python** ≥ 3.11 — [python.org](https://python.org)
- One LLM source. Pick at least one:
  - **Ollama** (recommended default) — [ollama.com](https://ollama.com), then `ollama pull translategemma:12b`
  - **Anthropic** API key from [console.anthropic.com](https://console.anthropic.com)
  - **Google Gemini** API key from [aistudio.google.com](https://aistudio.google.com)
  - **OpenAI** API key from [platform.openai.com](https://platform.openai.com)

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

### 6. Configure a remote provider (optional)

Open **Settings → Conexión y almacenamiento**, set the master password (section 8) and pick a provider.

**Direct mode (Anthropic, Gemini, OpenAI — default):**
1. Paste your API key.
2. Click **Conectar y cargar modelos**: the key is verified, encrypted and stored, and the available models appear in a list.
3. Pick a model. On the next session, unlock with the master password to load the list again.

Ollama lists its installed models automatically.

**Backend model (optional):** set the provider key in the backend environment, restart Flask, then choose **Origen del modelo → Modelo del backend**. No local key is needed.

### 7. Storage without a backend

**Settings → Conexión y almacenamiento** also selects where history is saved. **Automático** uses the Flask backend when it responds, otherwise GitHub when configured, otherwise this browser. Each target keeps its own history; switching does not migrate data.

**Change token** is always available in the GitHub section, also when the connection fails or the vault is locked; the current token is kept until the new one works.

**GitHub storage:** enter a token and, optionally, your user name or profile URL. The app uses the repository **`speak-mentor-data`** and creates it as **private** when it does not exist. Sessions, errors and generated vocabulary and exercises are committed to `data/speak-mentor.json` on its default branch.

| Case | Token needed |
|---|---|
| The app creates the repository | Classic with `repo` scope, or fine-grained with access to **All repositories** and **Administration** + **Contents** (Read and write) |
| `speak-mentor-data` already exists | Fine-grained limited to that repository with **Contents: Read and write** (recommended) |

The broader token can reach all your repositories: once the repository exists, consider replacing it with the limited one. An existing repository is never modified; if it is public, the app asks for confirmation. A repository can only be created in the token owner's account.

### 8. Master password

One master password encrypts the LLM API keys and the GitHub token in `localStorage`. It is typed in a single place, at the top of **Settings → Conexión y almacenamiento**, and unlocks all of them; the header shows a shortcut while they are locked. The full password is **never stored**: it stays in memory until you reload, close the tab or press **Bloquear todo**. Only its **last 3 characters** are saved in `localStorage` and shown as a reminder. This makes the password easier to guess for anyone who can read that storage, so use a long one (12 characters or more).

- There is no recovery. If you forget it, forget the stored keys and enter them again.
- Secrets saved with a different password in 0.2.0 can be migrated from Settings.
- All sites under the same `<user>.github.io` origin share `localStorage`, so use a long password.

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
| `GET` | `/llm/providers` | `{openai, anthropic, gemini}` flags — which providers have a server-side key |
| `GET` | `/llm/models?provider=X` | Live model list for the given provider (uses server-side key) |
| `POST` | `/llm/chat` | Proxy a chat call: `{provider, model, system, user, options, timeout}` → `{content}` |

---

## Settings Reference

Settings persist in `localStorage` under `speak-mentor-settings`. Decrypted API keys do **not** persist — they live in a separate in-memory Zustand store and die with the tab.

| Setting | Default | Description |
|---|---|---|
| Storage mode | `auto` | `auto` / `backend` / `github` / `browser` |
| Active provider | `ollama` | `ollama` / `anthropic` / `gemini` / `openai` |
| Ollama URL | `http://localhost` | Ollama host |
| Ollama port | `11434` | Ollama port |
| Ollama model | `translategemma:12b` | Active model (auto-detected from installed models) |
| Keep-alive | `-1` (indefinite) | How long the model stays in VRAM after the last request |
| Remote provider entries | `{}` | Per-provider: `{encryptedApiKey?, model, baseUrl?, useBackend?}` |
| Use backend proxy | off | Per remote provider — when on, calls route through `/api/llm/*` using a server-side key |
| Temperature | `0.2` | 0 = deterministic, 1 = creative |
| Top P | `0.9` | Sampling diversity |
| Context (tokens) | `4096` | Model context window |
| Timeout | `600s` | Max wait per request |
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
| `OPENAI_API_KEY` | — | If set, enables OpenAI via `/api/llm/*`. Required for OpenAI to work at all. |
| `ANTHROPIC_API_KEY` | — | If set, allows Anthropic via the backend proxy as an alternative to per-user encrypted keys. |
| `GEMINI_API_KEY` | — | If set, allows Gemini via the backend proxy. |
| `LLM_PROXY_TIMEOUT` | `600` | Per-request timeout in seconds for outbound provider calls. |

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

- **Ollama (default)**: 100% local. The browser calls `localhost:11434`; nothing leaves your machine.
- **Anthropic / Gemini / OpenAI (direct mode)**: your input text and the corrected output transit to the provider's API. The API key never leaves your browser unencrypted — it's stored only as an AES-GCM envelope and decrypted in memory using your master password.
- **Backend model (optional)**: text transits through your own Flask backend and then to the provider. The provider key lives in your server's environment, never in the browser.
- **Sessions, errors, stats**: written to the selected storage target — backend SQLite (`backend/instance/speak_mentor.db`), your GitHub repository, or this browser's `localStorage`. No analytics, no telemetry.

---

## Contributing

Issues and PRs welcome at [github.com/patchamama/speak-mentor](https://github.com/patchamama/speak-mentor).

---

## License

[MIT](LICENSE)
