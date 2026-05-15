# Speak-Mentor — Implementation Plan

> German learning app: correction (DE→DE) + translation (DE↔ES), CEFR-aware, with persistent error history.

**Version**: 0.1.0
**Date**: 2026-05-15
**Stack decided**: React 19 + Vite + TS · Flask + SQLite · Ollama (direct from browser)

---

## 1. Product overview

A learner-first German tutor running locally. The user writes German, picks a CEFR level (A1-C2), and gets:

- **Correction mode** (DE→DE): inline error highlighting with type tags (case, gender, preposition, word order, etc.), explanation in Spanish, rule reference, example, and pedagogical tips. Every error is persisted.
- **Translation mode** (DE↔ES): level-adapted translation with vocabulary, grammar, and false-friend notes.
- **History/Stats**: aggregated view of recurring error types over time, so the learner sees their patterns.

The LLM runs locally via **Ollama**. Model, URL, and port are user-configured.

---

## 2. Architecture

```
┌────────────────────────────────────────────────┐
│  Browser (React 19 + Vite + TS)               │
│                                                │
│  ┌──────────────┐    ┌──────────────────────┐ │
│  │ Correction   │    │ Settings (Ollama URL,│ │
│  │ Translation  │    │ port, model)         │ │
│  │ History      │    └──────────────────────┘ │
│  └──────┬───────┘                              │
│         │                                      │
│         ├──fetch JSON──> Ollama (localhost:11434)
│         │                                      │
│         └──REST───────> Flask (localhost:5000)│
└────────────────────────────────────────────────┘
                                  │
                                  ▼
                          SQLite (speak_mentor.db)
```

**Why browser → Ollama direct**: zero proxy latency, simpler infra. Requires `OLLAMA_ORIGINS=*` (or specific origin) when starting Ollama.

**Why Flask + SQLite**: persistent history, future multi-device sync option, server-side stats aggregation. Python ecosystem for future NLP analysis of error patterns.

---

## 3. Repository layout

```
speak-mentor/
├── PLAN.md                          # this file
├── README.md                        # quickstart for user
├── docs/
│   └── prompts/
│       ├── correction-de-de.md      # ✅ written
│       ├── translation.md           # ✅ written
│       └── prompt-builder.md        # ✅ written
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── features/                # SCOPE RULE: 1 feature → local
│       │   ├── correction/
│       │   │   ├── CorrectionContainer.tsx
│       │   │   ├── CorrectionView.tsx
│       │   │   ├── components/
│       │   │   │   ├── ErrorHighlight.tsx
│       │   │   │   ├── ErrorPanel.tsx
│       │   │   │   └── TipsList.tsx
│       │   │   ├── hooks/
│       │   │   │   └── useCorrection.ts
│       │   │   └── __tests__/
│       │   ├── translation/
│       │   │   ├── TranslationContainer.tsx
│       │   │   ├── TranslationView.tsx
│       │   │   ├── components/
│       │   │   ├── hooks/
│       │   │   └── __tests__/
│       │   ├── history/
│       │   │   ├── HistoryContainer.tsx
│       │   │   ├── HistoryView.tsx
│       │   │   ├── components/
│       │   │   │   ├── ErrorStatsChart.tsx
│       │   │   │   └── SessionList.tsx
│       │   │   └── hooks/
│       │   └── settings/
│       │       ├── SettingsContainer.tsx
│       │       ├── SettingsView.tsx
│       │       └── hooks/
│       ├── shared/                  # SCOPE RULE: 2+ features → global
│       │   ├── ollama/
│       │   │   ├── client.ts
│       │   │   ├── promptBuilder.ts
│       │   │   ├── schemas.ts       # Zod schemas
│       │   │   └── templates/
│       │   │       ├── correction-system.ts
│       │   │       └── translation-system.ts
│       │   ├── api/
│       │   │   └── flaskClient.ts   # axios/fetch wrapper
│       │   ├── ui/
│       │   │   ├── LevelSelector.tsx
│       │   │   ├── LanguageSelector.tsx
│       │   │   ├── Button.tsx
│       │   │   └── Spinner.tsx
│       │   └── types/
│       │       └── index.ts
│       ├── stores/
│       │   ├── settingsStore.ts     # Zustand: ollama config
│       │   └── sessionStore.ts      # Zustand: current draft
│       └── styles/
│           └── index.css
└── backend/
    ├── pyproject.toml               # poetry or uv
    ├── app.py                       # Flask entry
    ├── config.py
    ├── models.py                    # SQLAlchemy
    ├── routes/
    │   ├── __init__.py
    │   ├── sessions.py
    │   ├── errors.py
    │   └── stats.py
    ├── services/
    │   └── stats_service.py         # aggregation logic
    ├── migrations/                  # alembic
    ├── tests/
    │   ├── test_sessions.py
    │   ├── test_errors.py
    │   └── test_stats.py
    └── speak_mentor.db              # gitignored
```

---

## 4. Database schema

```sql
-- sessions: each correction or translation attempt
CREATE TABLE sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  mode        TEXT NOT NULL CHECK(mode IN ('correction','translation')),
  source_lang TEXT NOT NULL CHECK(source_lang IN ('de','es')),
  target_lang TEXT NOT NULL CHECK(target_lang IN ('de','es')),
  level       TEXT NOT NULL CHECK(level IN ('A1','A2','B1','B2','C1','C2')),
  input_text  TEXT NOT NULL,
  output_text TEXT NOT NULL,
  raw_llm     TEXT,                  -- full JSON for replay
  model       TEXT,                  -- model name used
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_sessions_created ON sessions(created_at);
CREATE INDEX idx_sessions_mode    ON sessions(mode);

-- errors: each individual mistake (only for correction mode)
CREATE TABLE errors (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id     INTEGER NOT NULL,
  original       TEXT NOT NULL,
  correction     TEXT NOT NULL,
  type           TEXT NOT NULL,      -- enum from prompt schema
  severity       TEXT NOT NULL CHECK(severity IN ('critical','major','minor')),
  position_start INTEGER,
  position_end   INTEGER,
  explanation    TEXT NOT NULL,
  rule_reference TEXT,
  example        TEXT,
  level          TEXT NOT NULL,      -- denormalized from session for fast stats
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_errors_session ON errors(session_id);
CREATE INDEX idx_errors_type    ON errors(type);
CREATE INDEX idx_errors_level   ON errors(level);
CREATE INDEX idx_errors_created ON errors(created_at);
```

**Stats are computed on read** (no `error_stats` table). With proper indices, aggregations like "errors by type in last 30 days at B1" are sub-millisecond up to ~100k rows.

---

## 5. REST API contract (Flask)

Base: `http://localhost:5000/api`

| Method | Path                              | Purpose                                |
|--------|-----------------------------------|----------------------------------------|
| POST   | `/sessions`                       | Save a session + its errors            |
| GET    | `/sessions`                       | List sessions (paginated)              |
| GET    | `/sessions/:id`                   | Get one session with its errors        |
| DELETE | `/sessions/:id`                   | Delete session + cascade errors        |
| GET    | `/errors`                         | List errors (filterable by type, level)|
| GET    | `/stats/by-type`                  | Aggregate: count per error type        |
| GET    | `/stats/by-level`                 | Aggregate: count per level             |
| GET    | `/stats/timeline?days=30`         | Daily counts for last N days           |
| GET    | `/stats/top-rules?limit=10`       | Most-broken `rule_reference` values    |
| GET    | `/health`                         | Liveness                               |

### POST /sessions — request body

```json
{
  "mode": "correction",
  "source_lang": "de",
  "target_lang": "de",
  "level": "B1",
  "input_text": "...",
  "output_text": "...",
  "raw_llm": "{...}",
  "model": "llama3.1:8b",
  "errors": [
    {
      "original": "...",
      "correction": "...",
      "type": "case",
      "severity": "major",
      "position_start": 5,
      "position_end": 12,
      "explanation": "...",
      "rule_reference": "Akkusativ nach für",
      "example": "..."
    }
  ]
}
```

Returns `201` with `{ "session_id": 123 }`.

### CORS

`flask-cors` enabled for `http://localhost:5173` (Vite default) and any future origins added via env var.

---

## 6. Frontend state management

| State                       | Store                | Why                              |
|-----------------------------|----------------------|----------------------------------|
| Ollama config (URL/model)   | Zustand + localStorage | Persistent client setting        |
| Current input/draft         | Zustand              | Cross-component within feature   |
| LLM response cache          | React Query          | Caching + retry + loading states |
| Sessions list, stats        | React Query          | Server state, cache invalidation |

---

## 7. Epics & user stories

### EPIC 1 — Project bootstrap
**Goal**: working dev environment, both frontend and backend running.

- **US-1.1**: As a developer, I can `pnpm install && pnpm dev` and see the React app at `localhost:5173`.
- **US-1.2**: As a developer, I can `uv run flask run` (or equivalent) and hit `localhost:5000/api/health`.
- **US-1.3**: ESLint + Prettier + Tailwind configured. CI-ready scripts in `package.json`.
- **US-1.4**: Backend has SQLAlchemy + Alembic + pytest configured. Initial migration creates the schema.
- **US-1.5**: README with prerequisites (Node 20+, Python 3.11+, Ollama installed, `OLLAMA_ORIGINS=*`).

### EPIC 2 — Ollama integration & settings
**Goal**: configure and call Ollama from the browser.

- **US-2.1**: As a user, I can open Settings and enter Ollama URL (default `http://localhost:11434`), port, and model name (default `llama3.1:8b`).
- **US-2.2**: Settings persists in localStorage and hydrates on app load.
- **US-2.3**: A "Test connection" button calls `GET /api/tags` on Ollama and shows the list of installed models, letting the user pick one.
- **US-2.4**: If Ollama is unreachable, a clear error appears with link to README troubleshooting.
- **US-2.5**: A prompt builder module assembles the system+user prompt per mode and validates response with Zod.

**Acceptance**: clicking "Test" with Ollama running shows real model list. Bad URL shows friendly error.

### EPIC 3 — Correction mode (DE→DE)
**Goal**: correct German with marked errors and tips.

- **US-3.1**: Text area for German input (min 1 char, max 2000), CEFR level selector (A1-C2).
- **US-3.2**: "Corregir" button → spinner → response.
- **US-3.3**: Response shows: corrected text on top, original with inline highlighted errors below, side panel with error list (type chip, severity badge, explanation, rule, example).
- **US-3.4**: Hovering an inline highlight scrolls/focuses the corresponding side-panel item.
- **US-3.5**: Each error type has a color (case=red, gender=blue, word_order=purple, etc.) — legend visible.
- **US-3.6**: Below: tips section + level assessment (detected vs target).
- **US-3.7**: "Guardar" button POSTs to `/api/sessions` and toasts confirmation.
- **US-3.8**: If LLM response invalid JSON twice, show raw output and a retry button.
- **US-3.9**: Errors with `position_unreliable: true` appear only in side panel, not inline.

**Acceptance**: correcting the A2 example from `correction-de-de.md` shows 3 inline highlights, side panel populated, tips visible, saves to backend.

### EPIC 4 — Translation mode (DE↔ES)
**Goal**: level-aware translation with notes.

- **US-4.1**: Source/target language selector (DE↔ES, swap button), level selector.
- **US-4.2**: Text area, "Traducir" button.
- **US-4.3**: Output shows primary translation prominently, alternatives in expandable section.
- **US-4.4**: Two side sections: "Vocabulario" (false friends, idioms) and "Gramática" (Konjunktiv, etc.).
- **US-4.5**: "Adaptación al nivel" note explaining what was simplified/preserved.
- **US-4.6**: "Guardar" persists session (no errors array for translation mode).

### EPIC 5 — History & stats
**Goal**: learner sees their progress and recurring weaknesses.

- **US-5.1**: History page lists last N sessions, sortable by date, filterable by mode/level.
- **US-5.2**: Click a session → see full original + corrected + errors.
- **US-5.3**: Stats dashboard:
  - Bar chart: errors by type (top 10).
  - Bar chart: errors by level.
  - Line chart: errors per day, last 30 days.
  - Top 10 broken `rule_reference` (with example sentence from history).
- **US-5.4**: "Eliminar sesión" deletes session + cascades.
- **US-5.5**: Export history as JSON (button → download).

### EPIC 6 — Polish (v1 closeout)
- **US-6.1**: Keyboard shortcut Cmd/Ctrl+Enter to submit.
- **US-6.2**: Dark mode toggle.
- **US-6.3**: A11y: keyboard nav for error panel, ARIA labels on highlights, screen-reader-friendly tip list.
- **US-6.4**: Loading skeletons.
- **US-6.5**: Error boundary at root.

### EPIC 7 — v2 deferred (NOT in v1)
- Generate exercises from past errors.
- Spaced repetition for top rules.
- Audio (TTS) for corrected sentence.
- Multi-user accounts.

---

## 8. Implementation order (TDD aligned)

Each phase ends with a commit. Follow project's TDD workflow.

| # | Phase                                  | Output                                       | Tests                                    |
|---|----------------------------------------|----------------------------------------------|------------------------------------------|
| 1 | Repo scaffold (frontend + backend)     | Working dev servers, ESLint/Prettier         | Smoke: app boots, /health responds       |
| 2 | DB schema + migrations + models        | SQLAlchemy models, Alembic migration         | pytest: model CRUD                       |
| 3 | Flask sessions/errors endpoints        | POST/GET/DELETE working                      | pytest: route + integration              |
| 4 | Flask stats endpoints                  | by-type, by-level, timeline, top-rules       | pytest: with seeded data                 |
| 5 | Settings feature (Ollama config + UI)  | Settings store + view + test connection      | Vitest: store + component                |
| 6 | Prompt builder + Ollama client         | promptBuilder.ts + client.ts + Zod schemas   | Vitest: build correct prompts, validate  |
| 7 | Correction feature                     | Container + view + error highlighting        | Vitest: render, hover, save              |
| 8 | Translation feature                    | Container + view + notes                     | Vitest                                   |
| 9 | History + stats UI                     | Pages with charts (recharts)                 | Vitest                                   |
| 10| Polish + a11y audit                    | Shortcuts, dark mode, ARIA                   | accessibility-auditor                    |

---

## 9. Open decisions for next step

These are calls to make BEFORE Sonnet starts coding. Mark answers in `DECISIONS.md`:

1. **Package manager (frontend)**: pnpm | npm | bun? → **suggest pnpm**.
2. **Python deps tool**: poetry | uv | pip-tools? → **suggest uv** (fast, modern).
3. **Chart library**: recharts | visx | chart.js? → **suggest recharts** (React-first, simple).
4. **HTTP client (frontend → Flask)**: fetch wrapper | axios | ky? → **suggest ky** (small, modern).
5. **Component library**: headless (Radix) + Tailwind | shadcn/ui | none? → **suggest shadcn/ui** for speed.
6. **Form lib**: react-hook-form | uncontrolled | conform? → **suggest react-hook-form**.
7. **Toast lib**: sonner | react-hot-toast? → **suggest sonner**.
8. **Markdown rendering** (for explanations with formatting): react-markdown | none? → **none in v1**, plain text.

---

## 10. Non-functional requirements

- **Performance**: LLM call timeout 60s; abort button visible after 3s.
- **Privacy**: all data local. No telemetry. README explicit about this.
- **i18n**: UI strings in `frontend/src/i18n/` with `es` and `de` locales. v1 ships `es` only; structure ready for `de`.
- **Versioning**: app version in `package.json`, displayed in footer banner. Bump per CLAUDE.md rule.
- **Testing**: Vitest + RTL frontend, pytest backend. Min 70% coverage on `shared/` and `services/`.
- **Security**:
  - No `dangerouslySetInnerHTML`.
  - Sanitize LLM output before render (errors might contain `<` characters).
  - CORS allowlist (no wildcard) on Flask.
  - SQLite file outside web root (Flask doesn't serve it).

---

## 11. Out of scope (explicit)

- Cloud LLM (OpenAI, Anthropic). Ollama only in v1.
- Mobile native. Web responsive only.
- Voice input/output.
- Real-time as-you-type correction. Submit-based only.
- Multi-language UI beyond ES (DE deferred).

---

## 12. Definition of Done — v1

- Both servers boot with `make dev`.
- User can correct text, see highlights, save it, view history, see stats.
- User can translate, see level-adapted output with notes.
- Settings persists.
- README runs end-to-end on a fresh machine following its instructions.
- 70%+ coverage on critical modules.
- Lighthouse a11y > 90 on main pages.
