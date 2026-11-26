# GitHub data repo auto-creation and master password
Objective: below. Branch: feat/repo-autocreate-master-password. Release 0.3.0; push and tag only when the user asks. Tests: `cd frontend && npx vitest run`.

## Specs
- S1: "si se pone el token de un gh y el usuario de gh o url de gh personal, que automáticamente se cree un repo privado para guardar la información en caso de no existir, siempre usando el mismo nombre como speak-mentor-data"
- S2: "Corrije los errores y el lint."
- S3: "se pueda poner una clave maestra de desbloqueo que se puede usar para encriptar la api key del llm y el token de gh en el localstorage y si se pone esa clave maestra, que automáticamente se revise en el localstorage esas claves y se usen, y clave esa contraseña maestra no se guarda en el localstorage."

## Tasks
- T1 (S2) fix stale tests and lint. inline. done
- T2 (S1) find or create private speak-mentor-data. inline. done
- T3 (S3) one master password unlocks every stored secret. inline. done

## Log
- L1 (2026-11-26): "se puede si se pone el token de un gh y el usuario de gh o url de gh personal,  que automáticamente se cree un repo privado para guardar la información en caso de no existir, siempre usando el mismo nombre como speak-mentor-data, si es posible integralo. Corrije los errores y el lint. Me gustaría también que se pueda poner una clave maestra de desbloqueo que se puede usar para encriptar la api key del llm y el token de gh en el localstorage y si se pone esa clave maestra, que automáticamente se revise en el localstorage esas claves y se usen, y clave esa contraseña maestra no se guarda en el localstorage."
- Evidence: the two failing tests were stale (behaviour changed on purpose in 4ad8779 and 338f2a9); tests updated, product code unchanged. 26 skipped tests need a live Ollama.
- Verification: vitest 78 passed, pytest 27 passed, tsc, lint and build clean. Browser smoke on the production build with mocked GitHub and OpenAI: repo created, no plaintext secret or password in storage, one password unlocks after reload. Real GitHub API not exercised; fine-grained creation permissions unconfirmed.
- Risk: item 2 (credentials). RDD off. No independent verifier run.
