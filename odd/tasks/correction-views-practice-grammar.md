# Correction views, targeted practice and grammar explanations
Objective: below. Branch: feat/correction-views-grammar. Release 0.7.0; commit, push origin main and deploy. Tests: `cd frontend && npx vitest run`.

## Specs
- S1: "los errores se muestren ocupando todo el espacio disponible cada card y así que se pueda leer rápido sin mucho scroll pero también que se muestre la opción de verlo en la forma como se muestra ahora más organizado."
- S2: "Al final de la evaluación de la corrección aparece \"Repasa las expresiones completas\", deseo que se ponga un enlace ahí que me permita practicar más con ejercicios del problema que se detecte."
- S3: "En el caso de problemas de gramática que aparezca un botón que permita explicar la gramática y de ser posible mostrar ejemplos en tablas y explicar lo mejor posible para hispanohablantes."

## Tasks
- T1 (S1) card grid and detailed views, persisted choice. inline. done
- T2 (S2) per-error-type practice buttons next to the advice. inline. done
- T3 (S3) grammar explanation dialog: AI explanation plus curated reference tables. inline. done

## Log
- L1 (2026-11-26): "mejora para que en la corrección, los errores se muestren ocupando todo el espacio disponible cada card y así que se pueda leer rápido sin mucho scroll pero también que se muestre la opción de verlo en la forma como se muestra ahora más organizado. Al final de la evaluación de la corrección aparece \"Repasa las expresiones completas\", deseo que se ponga un enlace ahí que me permita practicar más con ejercicios del problema que se detecte. En el caso de problemas de gramática que aparezca un botón que permita explicar la gramática y de ser posible mostrar ejemplos en tablas y explicar lo mejor posible para hispanohablantes."
- Evidence: the quoted advice is model output, not app text.
- Verification: vitest 110 passed (26 need a live Ollama), tsc, lint and build clean. Browser with a mocked model: 6 errors take 378px in 4 columns (937px detailed); practice sent only the 2 case errors; dialog fits a 390px screen. Real model output quality not tested.
- Risk: none.
