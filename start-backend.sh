#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# ── Ollama ────────────────────────────────────────────────────────────────────
echo "→ Stopping Ollama..."
pkill -9 -f "ollama serve" 2>/dev/null || true
sleep 1

echo "→ Starting Ollama (OLLAMA_ORIGINS=* OLLAMA_HOST=localhost:11434)..."
OLLAMA_ORIGINS="*" OLLAMA_HOST="localhost:11434" /Applications/Ollama.app/Contents/Resources/ollama serve &
OLLAMA_PID=$!

# Wait until Ollama is ready
echo -n "→ Waiting for Ollama"
for i in $(seq 1 20); do
  if curl -sf http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo " ready"
    break
  fi
  echo -n "."
  sleep 1
done

# ── Backend ───────────────────────────────────────────────────────────────────
echo "→ Starting Flask backend..."
cd "$ROOT/backend"

if [ ! -d ".venv" ]; then
  echo "  No .venv found — creating virtual environment..."
  python3 -m venv .venv
  .venv/bin/pip install -r requirements.txt -q
fi

FLASK_APP=wsgi:app .venv/bin/flask run --port 5000

# If Flask exits, kill Ollama too
kill $OLLAMA_PID 2>/dev/null || true
