# Provider billing links and Spanish/German UI
Objective: below. Branch: feat/i18n-billing-links. Release 0.6.0; always commit, push origin main and deploy. Tests: `cd frontend && npx vitest run`.

## Specs
- S1: "agrega link al servicio de api key donde se compra o se sabe cuánto queda de dinero."
- S2: "Deseo que la app esté en español y alemán."
- Assumption: AI explanations follow the selected UI language (prompts already accept `de`).

## Tasks
- T1 (S1) key, billing and usage links per provider. inline. done
- T2 (S2) language store, es/de dictionaries, all UI strings. inline. done
- T3 (S2) German version of the common-errors content. inline. done

## Log
- L1 (2026-11-26): "agrega link al servicio de api key donde se compra o se sabe cuánto queda de dinero. Deseo que la app esté en español y alemán."
- Verification: vitest 96 passed (26 need a live Ollama), pytest 27 passed, tsc, lint and build clean. Browser walkthrough in German found no Spanish UI text. German text not reviewed by a native speaker. Billing URLs: Anthropic billing confirmed by docs search; the others were not opened with an account.
- Risk: none.
