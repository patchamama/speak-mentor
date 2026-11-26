# Standalone frontend
Objective: run without backend, including GitHub JSON storage. Branch: feat/standalone-frontend. Delivery: ff-merge to main, push, Pages deploy, tag v0.2.0. Tests: `cd frontend && npx vitest run`, `cd backend && .venv/bin/python -m pytest`.

## Specs
- S1: "que se pueda usar sin backend en el caso de que el backend no exista"
- S2: "los prompts se puedan usar usando una IA externa directamente y no desde el backend como openai, ollama, anthropic, y así que funcione bien con el deploy en gh"
- S3: "si el backend existe y tiene un modelo de ia que se pueda seleccionar si usar el modelo del backend o directamente desde el frontend"
- S4: "Si se pone un token (agregar en configuración) del repo que se pueda guardar directamente en el repo en json los errores y documentos generados sin necesidad de un backend y así que funcione como si hubiera un backend"
- S5: "has al final commit + push origin main y deploy en gh"; version bumped, shown in banner, matching git tag.

## Tasks
- T1 (S1,S4) storage layer: backend | GitHub JSON | browser; save/history/stats ungated. inline. done (RED then 16/16 GREEN)
- T2 (S2,S3) OpenAI direct, backend/direct selector, Anthropic sampling params fix. inline. done (RED then 16/16 GREEN)
- T3 (S5) version 0.2.0, README, merge, push, deploy, tag. inline. pending

## Log
- L1 (2026-11-26): "me gustaría que mejores el frontend para que se pueda usar sin backend en el caso de que el backend no exista y que los prompts se puedan usar usando una IA externa directamente y no desde el backend como openai, ollama, anthropic, y así que funcione bien con el deploy en gh también. Así si el backend existe y tiene un modelo de ia que se pueda seleccionar si usar el modelo del backend o directamente desde el frontend. Si se pone un token (agregar en configuración) del repo que se pueda guardar directamente en el repo en json los errores y documentos generados sin necesidad de un backend y así que funcione como si hubiera un backend."
- L2: "has al final commit + push origin main y deploy en gh"
- Evidence: local main was 18 commits behind; ff-pulled. api.openai.com answers CORS preflight, so direct browser calls work. Baseline: 2 vitest failures (ErrorHighlight unreliable positions, schemas invalid type), 3 lint errors.
- Decisions: GitHub token encrypted with a master password (existing crypto/secret.ts). Auto storage order: backend, GitHub, browser. Repo is public: warn in UI.
- Verification: vitest 50 passed, 2 pre-existing failures; pytest 27 passed; tsc and build OK; lint has 1 pre-existing error. Browser smoke on the production build without backend (mocked LLM): translate, save, history OK. Real GitHub writes not exercised.
- Risk: item 2 (token and API key handling). RDD off. No independent verifier run.
