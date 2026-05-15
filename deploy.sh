#!/usr/bin/env bash
# deploy.sh — Build the frontend and copy assets into the Flask backend.
#
# Usage:
#   ./deploy.sh              # build + copy + start Flask on port 5001
#   ./deploy.sh --build-only # build + copy, do not start Flask
#   ./deploy.sh --no-build   # skip build, start Flask (use existing dist/)
#
# The script does NOT start Ollama. In production the browser must point to
# a remote Ollama instance via Settings > Conexión.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="${REPO_ROOT}/frontend"
BACKEND_DIR="${REPO_ROOT}/backend"
STATIC_DIR="${BACKEND_DIR}/static"
DIST_DIR="${FRONTEND_DIR}/dist"
FLASK_PORT="${FLASK_PORT:-5001}"

BUILD=true
START=true

for arg in "$@"; do
  case "$arg" in
    --build-only) START=false ;;
    --no-build)   BUILD=false ;;
    --help|-h)
      echo "Usage: $0 [--build-only | --no-build]"
      exit 0
      ;;
  esac
done

# ── 1. Build frontend ─────────────────────────────────────────────────────────
if [[ "$BUILD" == true ]]; then
  echo "Building frontend..."
  cd "${FRONTEND_DIR}"

  if [[ ! -d node_modules ]]; then
    echo "Installing npm dependencies..."
    npm ci --silent
  fi

  npm run build
  echo "Frontend built → ${DIST_DIR}"
fi

# ── 2. Copy dist into backend/static ─────────────────────────────────────────
if [[ "$BUILD" == true ]]; then
  echo "Copying assets to ${STATIC_DIR}..."
  rm -rf "${STATIC_DIR}"
  cp -r "${DIST_DIR}" "${STATIC_DIR}"
  echo "Assets copied."
fi

# ── 3. Start Flask (production-ready via waitress or gunicorn, fallback dev) ──
if [[ "$START" == false ]]; then
  echo "Build complete. Run Flask manually:"
  echo "  cd backend && flask --app wsgi:app run --port ${FLASK_PORT}"
  exit 0
fi

cd "${BACKEND_DIR}"

# Activate virtualenv if present
if [[ -f .venv/bin/activate ]]; then
  # shellcheck disable=SC1091
  source .venv/bin/activate
fi

echo ""
echo "Starting Flask on port ${FLASK_PORT}..."
echo "  App:  http://localhost:${FLASK_PORT}"
echo "  API:  http://localhost:${FLASK_PORT}/api/health"
echo ""
echo "Note: Ollama is NOT started by this script."
echo "      Configure the Ollama URL in Settings > Conexión."
echo ""

# Prefer production WSGI servers; fall back to Flask dev server
if python -c "import waitress" 2>/dev/null; then
  waitress-serve --port="${FLASK_PORT}" wsgi:app
elif python -c "import gunicorn" 2>/dev/null; then
  gunicorn wsgi:app --bind "0.0.0.0:${FLASK_PORT}" --workers 2
else
  echo "waitress and gunicorn not found — using Flask dev server (not for production)."
  echo "Install one: pip install waitress   or   pip install gunicorn"
  echo ""
  FLASK_APP=wsgi:app flask run --host=0.0.0.0 --port="${FLASK_PORT}"
fi
