# Speak Mentor

A local-first German language tutor powered by Ollama. Write German, get inline error highlighting with CEFR-aware corrections in Spanish, translate between German and Spanish, and track your mistakes over time.

All processing happens on your machine. No cloud APIs, no telemetry.

---

## Features

- **Correction mode (DE→DE)** — inline error highlighting by type (case, gender, word order…), severity badges, grammar explanations in Spanish, pedagogical tips, level assessment
- **Translation mode (DE↔ES)** — CEFR-level-adapted translation with vocabulary notes, grammar notes, and alternative phrasings
- **History & Stats** — paginated session history, error breakdowns by type/level/time, top broken grammar rules, JSON export
- **Settings** — configure Ollama URL, port, and model; test connection and pick from installed models
- **Dark mode** — persisted to localStorage
- **Keyboard shortcut** — `Cmd+Enter` / `Ctrl+Enter` to submit

---

## Tech Stack

### Frontend

| Technology | Version |
|---|---|
| Node.js | 24.x |
| React | 19 |
| TypeScript | 5.4 |
| Vite | 5.2 |
| Tailwind CSS | 3.4 |
| Zustand | 4.5 |
| TanStack Query | 5 |
| Zod | 3.22 |
| ky | 1.7 |
| react-hook-form | 7.51 |
| recharts | 2.12 |
| sonner | 1.5 |
| shadcn/ui (Radix) | — |
| Vitest + RTL | 1.5 / 16 |

### Backend

| Technology | Version |
|---|---|
| Python | 3.11+ |
| Flask | 3.1 |
| SQLAlchemy | 2.0 |
| Flask-SQLAlchemy | 3.1 |
| Alembic | 1.14 |
| flask-cors | 5+ |
| pytest | 8.2 |
| SQLite | (bundled) |

### LLM

| Technology | Notes |
|---|---|
| Ollama | Called directly from the browser |
| Default model | `translategemma:12b` |
| Supported models | Any model installed in Ollama |

---

## Prerequisites

- **Node.js** ≥ 20
- **Python** ≥ 3.11
- **Ollama** installed and running — [ollama.com](https://ollama.com)
- At least one model pulled, e.g. `ollama pull translategemma:12b`

---

## Getting Started

### 1. Clone

```bash
git clone <repo-url>
cd speak-mentor
```

### 2. Start Ollama with CORS enabled

Ollama must allow requests from the Vite dev server origin:

```bash
OLLAMA_ORIGINS="http://localhost:5173" ollama serve
```

Or to allow all origins during development:

```bash
OLLAMA_ORIGINS="*" ollama serve
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

### 4. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
FLASK_APP=wsgi:app flask run --port 5000
```

API runs at `http://localhost:5001`. On first run, SQLite database is created automatically at `backend/instance/speak_mentor.db`.

> **Note (macOS):** port 5000 is occupied by AirPlay Receiver (ControlCenter). Flask runs on 5001 to avoid the conflict.

### 5. Both at once (requires `make`)

```bash
make dev
```

---

## Project Structure

```
speak-mentor/
├── frontend/
│   └── src/
│       ├── features/
│       │   ├── correction/     # Correction mode
│       │   ├── translation/    # Translation mode
│       │   ├── history/        # History & stats
│       │   └── settings/       # Ollama configuration
│       ├── shared/
│       │   ├── ollama/         # Prompt builder, Zod schemas, Ollama client
│       │   ├── api/            # Flask REST client (ky)
│       │   ├── ui/             # Shared components (Button, Spinner, etc.)
│       │   └── types/          # Shared TypeScript types
│       ├── stores/             # Zustand stores (settings, session, theme)
│       └── components/         # App-level components (ErrorBoundary)
└── backend/
    ├── speak_mentor/
    │   ├── models.py           # SQLAlchemy models (Session, Error)
    │   ├── routes/             # Flask blueprints
    │   └── services/           # Business logic
    └── tests/                  # pytest suite
```

**Scope rule**: components used by 2+ features live in `shared/`. Single-feature components stay local.

---

## Running Tests

```bash
# Frontend (Vitest)
cd frontend && npm test

# Backend (pytest)
cd backend && pytest
```

Current coverage: **29 frontend tests**, **11 backend tests**.

---

## API Reference

Base URL: `http://localhost:5000/api`

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness check |
| `POST` | `/sessions` | Save a session + errors |
| `GET` | `/sessions` | List sessions (paginated) |
| `GET` | `/sessions/:id` | Get session with errors |
| `DELETE` | `/sessions/:id` | Delete session (cascades errors) |
| `GET` | `/errors` | List errors (filterable) |
| `GET` | `/stats/by-type` | Error count per type |
| `GET` | `/stats/by-level` | Error count per CEFR level |
| `GET` | `/stats/timeline?days=30` | Daily counts, last N days |
| `GET` | `/stats/top-rules?limit=10` | Most broken grammar rules |

---

## Environment Variables

### Backend

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///speak_mentor.db` | SQLAlchemy connection string |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed origins |
| `SECRET_KEY` | `dev-secret-key` | Flask secret (change in production) |

### Ollama

| Variable | Description |
|---|---|
| `OLLAMA_ORIGINS` | Origins allowed to call Ollama directly from the browser |

---

## Known Limitations & Pending Work

### Functional gaps

- **No router** — navigation is simple `useState`. Deep linking and browser back/forward don't work. Needs `react-router-dom` or TanStack Router.
- **Skeletons not wired** — `Skeleton` components exist but loading states in History still use a plain spinner. Needs integration in `SessionList` and stats panels.
- **Alembic not initialized** — database schema is created via `db.create_all()` on startup. Alembic is installed but migrations directory was not scaffolded. Needed before any schema change.
- **No Ollama abort** — the 60s timeout is set on `ky`, but there is no visible abort button after 3s as specified in the non-functional requirements.
- **Position offset accuracy** — the post-processing step recovers positions when the LLM gets them wrong, but overlapping error spans are not rendered (last span wins). Edge case with very long inputs.

### Quality

- **Test coverage below 70% target** on `shared/` modules — `client.ts` has no unit tests (requires Ollama mock). The `flaskClient.ts` has no tests either.
- **No E2E tests** — no Playwright or Cypress suite for the full correction/translation flow.
- **ESLint not enforced in CI** — there is no CI pipeline. `npm run lint` may surface warnings.

### UX / Design

- **No loading skeleton in History stats** — charts appear abruptly when data loads.
- **Error panel scroll sync** — clicking an inline highlight scrolls the error panel item, but not vice versa (clicking a panel item does not scroll the highlight into view if off-screen).
- **Mobile layout** — designed responsive but not tested on small screens.

### Deferred (v2)

- Generate exercises from past errors
- Spaced repetition for top broken rules
- Audio (TTS) for corrected sentence
- Multi-user accounts
- German UI locale (`de`)
- Cloud LLM option (OpenAI, Anthropic)

---

## Privacy

All data stays on your machine. The app calls Ollama on `localhost`. The Flask backend writes only to a local SQLite file. No analytics, no external requests.

---

## License

MIT
