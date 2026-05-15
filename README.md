# Speak Mentor

> A local-first German language tutor powered by Ollama.

Write German, get inline CEFR-aware corrections with color-coded error highlighting, translate between German and Spanish, and track your mistakes over time — all running on your own machine. No cloud APIs, no telemetry, no subscriptions.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Features

| Feature | Details |
|---|---|
| **Correction (DE→DE)** | Inline error highlighting by type (case, gender, word order…), severity badges, grammar explanations in Spanish, pedagogical tips, CEFR level assessment |
| **Translation (DE↔ES)** | Level-adapted translation with vocabulary notes, grammar notes, register alternatives |
| **History & Stats** | Paginated session history, error breakdowns by type / level / timeline, top broken rules, JSON export |
| **Settings** | Ollama URL, port, model selector, temperature / top\_p / context window / timeout, editable system prompts |
| **Dark mode** | Persisted to `localStorage` |
| **Keyboard shortcut** | `Cmd+Enter` / `Ctrl+Enter` to submit |
| **Elapsed timer** | Live second counter on the submit button while waiting for the model |

---

## Tech Stack

### Frontend

| Technology | Version | Role |
|---|---|---|
| [Node.js](https://nodejs.org) | ≥ 20 | Runtime |
| [React](https://react.dev) | 19.x | UI framework |
| [TypeScript](https://www.typescriptlang.org) | 5.4 | Type safety |
| [Vite](https://vitejs.dev) | 5.2 | Dev server & bundler |
| [Tailwind CSS](https://tailwindcss.com) | 3.4 | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com) + Radix UI | — | Accessible component primitives |
| [Zustand](https://zustand-demo.pmnd.rs) | 4.5 | Client state (settings, theme) |
| [TanStack Query](https://tanstack.com/query) | 5.x | Server state & caching |
| [Zod](https://zod.dev) | 3.22 | LLM response validation |
| [ky](https://github.com/sindresorhus/ky) | 1.7 | HTTP client |
| [react-hook-form](https://react-hook-form.com) | 7.51 | Form management |
| [Recharts](https://recharts.org) | 2.12 | Stats charts |
| [Sonner](https://sonner.emilkowal.ski) | 1.5 | Toast notifications |
| [Vitest](https://vitest.dev) + [RTL](https://testing-library.com/react) | 1.5 / 16 | Unit & component tests |

### Backend

| Technology | Version | Role |
|---|---|---|
| [Python](https://python.org) | ≥ 3.11 | Runtime |
| [Flask](https://flask.palletsprojects.com) | ≥ 3.1 | REST API |
| [SQLAlchemy](https://www.sqlalchemy.org) | ≥ 2.0.36 | ORM |
| [Flask-SQLAlchemy](https://flask-sqlalchemy.palletsprojects.com) | ≥ 3.1 | Flask integration |
| [Alembic](https://alembic.sqlalchemy.org) | ≥ 1.14 | Schema migrations |
| [flask-cors](https://flask-cors.readthedocs.io) | ≥ 5.0 | CORS headers |
| [pytest](https://pytest.org) | ≥ 8.2 | Test suite |
| SQLite | bundled | Local database |

### LLM

| | |
|---|---|
| **Runtime** | [Ollama](https://ollama.com) — called directly from the browser |
| **Default model** | `translategemma:12b` |
| **Supported** | Any model installed in Ollama |
| **Protocol** | `POST /api/chat` with JSON mode (`format: "json"`) |

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
git clone https://github.com/mandymozart/speak-mentor.git
cd speak-mentor
```

### 2. Start Ollama with CORS enabled

Ollama must allow requests from the browser. See the full per-OS commands in the [Terminal commands](#ollama-terminal-commands) section below.

**Quick start (all platforms):**

```bash
# macOS / Linux
pkill -f ollama
OLLAMA_HOST=0.0.0.0:11434 OLLAMA_ORIGINS="*" ollama serve
```

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

> **macOS note:** port 5000 is occupied by AirPlay Receiver (ControlCenter). The backend runs on **5001**.

### 5. Scripts (recommended)

```bash
# Start Ollama + Flask backend
./start-backend.sh

# Start Vite frontend
./start-frontend.sh
```

---

## Ollama Terminal Commands

The **Settings → Terminal** tab in the app shows these commands inline. For reference:

### macOS

```bash
pkill -f ollama
OLLAMA_HOST=0.0.0.0:11434 OLLAMA_ORIGINS="*" ollama serve
```

### Linux

```bash
pkill -f ollama
OLLAMA_HOST=0.0.0.0:11434 OLLAMA_ORIGINS="*" ollama serve
```

### Windows — PowerShell

```powershell
Stop-Process -Name "ollama" -Force -ErrorAction SilentlyContinue
$env:OLLAMA_HOST="0.0.0.0:11434"; $env:OLLAMA_ORIGINS="*"; ollama serve
```

### Windows — CMD

```cmd
taskkill /F /IM ollama.exe 2>nul
set OLLAMA_HOST=0.0.0.0:11434 && set OLLAMA_ORIGINS=* && ollama serve
```

### Verify it works

```bash
curl http://localhost:11434/api/tags
# Should return JSON with your installed models
```

---

## Project Structure

```
speak-mentor/
├── frontend/
│   └── src/
│       ├── features/
│       │   ├── correction/     # DE→DE correction with inline highlighting
│       │   ├── translation/    # DE↔ES translation
│       │   ├── history/        # Session history & stats
│       │   └── settings/       # Ollama config, model params, prompts, terminal
│       ├── shared/
│       │   ├── ollama/         # Prompt builder, Zod schemas, Ollama client
│       │   ├── api/            # Flask REST client (ky)
│       │   ├── hooks/          # Shared React hooks (input history, elapsed timer)
│       │   ├── ui/             # Shared components (Button, Spinner, LevelSelector…)
│       │   └── types/          # Shared TypeScript types
│       ├── stores/             # Zustand stores (settings, session, theme)
│       └── components/         # App-level components (ErrorBoundary)
└── backend/
    ├── speak_mentor/
    │   ├── models.py           # SQLAlchemy models (Session, Error)
    │   ├── routes/             # Flask blueprints
    │   └── services/           # Business logic
    └── tests/                  # pytest suite (11 tests)
```

**Scope rule:** components used by 2+ features live in `shared/`. Single-feature components stay local.

---

## Running Tests

```bash
# Frontend — Vitest (29 tests)
cd frontend && npm test

# Backend — pytest (11 tests)
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

## Environment Variables

### Backend

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///speak_mentor.db` | SQLAlchemy connection string |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:5174` | Allowed origins |
| `SECRET_KEY` | `dev-secret-key` | Flask secret key (change in production) |

### Ollama

| Variable | Description |
|---|---|
| `OLLAMA_HOST` | Bind address, e.g. `0.0.0.0:11434` |
| `OLLAMA_ORIGINS` | Origins allowed to call Ollama from the browser — set to `*` for local dev |

---

## Settings Reference

All settings are persisted in `localStorage` under `speak-mentor-settings`.

| Setting | Default | Description |
|---|---|---|
| Ollama URL | `http://localhost` | Ollama host |
| Port | `11434` | Ollama port |
| Model | `translategemma:12b` | Active model |
| Temperature | `0.2` | 0 = deterministic, 1 = creative |
| Top P | `0.9` | Sampling diversity |
| Context (tokens) | `4096` | Model context window |
| Timeout | `300s` (5 min) | Max wait per request |
| Correction prompt | (built-in) | System prompt for correction mode |
| Translation prompt | (built-in) | System prompt for translation mode |

---

## Known Limitations

### Functional

- **No router** — navigation via `useState`; browser back/forward and deep links don't work.
- **Alembic not scaffolded** — schema is created via `db.create_all()`. Needs migration init before any schema change.
- **No abort button** — there's no way to cancel an in-flight request other than waiting for the timeout.
- **Overlapping error spans** — when two errors overlap in the original text, only the last span is rendered.

### Quality

- `shared/ollama/client.ts` and `shared/api/flaskClient.ts` have no unit tests (require mocks for Ollama and Flask).
- No E2E test suite (Playwright / Cypress).
- No CI pipeline — `npm run lint` and `pytest` must be run manually.

### UX

- History stats charts appear without a loading skeleton.
- Clicking an error panel item doesn't scroll the inline highlight into view.
- Mobile layout not tested.

---

## Roadmap (v2+)

- Exercise generation from past errors
- Spaced repetition for top broken grammar rules
- TTS audio for corrected sentences
- Abort button for in-flight requests
- React Router for deep linking
- Cloud LLM option (OpenAI, Anthropic)
- Multi-user accounts
- German UI locale

---

## Privacy

All data stays on your machine. The app calls Ollama on `localhost`. The Flask backend writes only to a local SQLite file. No analytics, no external requests of any kind.

---

## Contributing

Issues and PRs welcome at [github.com/mandymozart/speak-mentor](https://github.com/mandymozart/speak-mentor).

---

## License

[MIT](LICENSE)
