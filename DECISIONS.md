# Open Decisions — to confirm before implementation

> Mark each row with your choice. Sonnet will read this before coding.

| #   | Decision                         | Suggested          | Alternatives                              | Chosen |
| --- | -------------------------------- | ------------------ | ----------------------------------------- | ------ |
| 1   | Frontend package manager         | pnpm               | npm, bun                                  |        |
| 2   | Python deps tool                 | uv                 | poetry, pip-tools                         |        |
| 3   | Chart library                    | recharts           | visx, chart.js                            |        |
| 4   | HTTP client (frontend)           | ky                 | axios, fetch wrapper                      |        |
| 5   | Component library                | shadcn/ui          | Radix + Tailwind raw, none                |        |
| 6   | Form library                     | react-hook-form    | uncontrolled, conform                     |        |
| 7   | Toast library                    | sonner             | react-hot-toast                           |        |
| 8   | Markdown in explanations (v1)    | none (plain)       | react-markdown                            |        |
| 9   | Default Ollama model             | translategemma:12b | llama3.1:8b, qwen2.5:7b, mistral-nemo:12b |        |
| 10  | Flask app factory or single-file | factory            | single-file                               |        |
| 11  | Alembic for migrations           | yes                | manual SQL                                |        |
