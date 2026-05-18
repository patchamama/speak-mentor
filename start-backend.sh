#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"

# ── Detect platform ────────────────────────────────────────────────────────────
PLATFORM="linux"
if [[ "$(uname)" == "Darwin" ]]; then
  PLATFORM="macos"
elif grep -qi microsoft /proc/version 2>/dev/null; then
  PLATFORM="wsl2"
fi

# On WSL2, the project may live on a Windows filesystem (9p/NTFS, mounted at /mnt/c/, etc.).
# Python venvs break on 9p: symlinks, permissions, and pip vendor files are incompatible with NTFS.
# Fix: when the backend path is on a Windows-mounted drive, place the venv on the Linux filesystem.
is_windows_fs() { stat --file-system "$1" 2>/dev/null | grep -qi "v9fs\|9p"; }

if [[ "$PLATFORM" == "wsl2" ]] && is_windows_fs "$BACKEND"; then
  VENV_DIR="$HOME/.venvs/speak-mentor-backend"
  echo "Note: project is on Windows filesystem (9p) — venv will be at $VENV_DIR"
else
  VENV_DIR="$BACKEND/.venv"
fi

VENV_BIN="$VENV_DIR/bin"

# ── Sanity checks ──────────────────────────────────────────────────────────────
if ! command -v python3 &>/dev/null; then
  echo "Error: python3 not found. Install Python 3 and retry."
  exit 1
fi

REQUIREMENTS="$BACKEND/requirements.txt"
if [ ! -f "$REQUIREMENTS" ]; then
  echo "Error: $REQUIREMENTS not found."
  exit 1
fi

# ── Virtual environment ────────────────────────────────────────────────────────
echo "→ Checking virtual environment..."
cd "$BACKEND"

has_python() { [ -x "$VENV_BIN/python3" ] || [ -x "$VENV_BIN/python" ]; }

# Resolve python binary inside the venv
venv_python() {
  if [ -x "$VENV_BIN/python3" ]; then echo "$VENV_BIN/python3"
  else echo "$VENV_BIN/python"
  fi
}

# Always use "python -m pip" and "python -m flask" instead of the bin/ scripts.
# On Ubuntu 24.04 / Python 3.12, ensurepip installs pip as a module but does NOT
# create bin/pip or bin/flask — using the module form bypasses that entirely.

# Create venv if python binary is missing
if ! has_python; then
  echo "  Creating virtual environment at $VENV_DIR..."
  mkdir -p "$(dirname "$VENV_DIR")"
  if ! python3 -m venv "$VENV_DIR"; then
    echo ""
    echo "Error: python3 -m venv failed."
    echo "  Ubuntu/Debian/WSL2: sudo apt install python3-venv python3-pip"
    echo "  Fedora/RHEL:        sudo dnf install python3"
    exit 1
  fi
fi

PYBIN="$(venv_python)"

# Ensure pip module is available (ensurepip bootstraps it if missing)
if ! "$PYBIN" -m pip --version &>/dev/null 2>&1; then
  echo "  pip module missing — bootstrapping..."
  if ! "$PYBIN" -m ensurepip --upgrade 2>/dev/null; then
    echo ""
    echo "Error: cannot bootstrap pip."
    echo "  Ubuntu/Debian/WSL2: sudo apt install python3-pip"
    exit 1
  fi
fi

# Install/update requirements when requirements.txt is newer than the sentinel file.
# Sentinel is touched after a successful install so repeated runs skip pip entirely.
SENTINEL="$VENV_DIR/.requirements.installed"

if [ ! -f "$SENTINEL" ] || [ "$REQUIREMENTS" -nt "$SENTINEL" ]; then
  echo "  Installing/updating requirements..."
  "$PYBIN" -m pip install --upgrade pip -q
  "$PYBIN" -m pip install -r "$REQUIREMENTS" -q
  touch "$SENTINEL"
  echo "  Requirements installed."
else
  echo "  Requirements up-to-date."
fi

# ── Stop any running instance ──────────────────────────────────────────────────
FLASK_PORT=5001
echo "→ Stopping existing Flask instance on port $FLASK_PORT..."

# Kill by port first (works on all platforms)
if command -v lsof &>/dev/null; then
  lsof -ti:"$FLASK_PORT" 2>/dev/null | xargs kill -TERM 2>/dev/null || true
elif command -v ss &>/dev/null; then
  fuser "${FLASK_PORT}/tcp" 2>/dev/null | xargs kill -TERM 2>/dev/null || true
fi

# Also kill by process pattern as fallback
pkill -TERM -f "flask run --port $FLASK_PORT" 2>/dev/null || true
pkill -TERM -f "wsgi:app" 2>/dev/null || true

# Wait up to 3s for the port to be released
for i in $(seq 1 3); do
  if ! (echo >/dev/tcp/127.0.0.1/"$FLASK_PORT") &>/dev/null 2>&1; then
    break
  fi
  sleep 1
done

# Force kill if still alive
if (echo >/dev/tcp/127.0.0.1/"$FLASK_PORT") &>/dev/null 2>&1; then
  echo "  Port still in use — force killing..."
  if command -v lsof &>/dev/null; then
    lsof -ti:"$FLASK_PORT" 2>/dev/null | xargs kill -9 2>/dev/null || true
  fi
  fuser -k "${FLASK_PORT}/tcp" 2>/dev/null || true
  sleep 1
fi

# ── Flask ──────────────────────────────────────────────────────────────────────
echo ""
echo "→ Starting Flask backend..."
echo "  Platform  = $PLATFORM"
echo "  Python    = $("$PYBIN" --version)"
echo "  FLASK_APP = wsgi:app"
echo "  PORT      = $FLASK_PORT"
echo ""

FLASK_APP=wsgi:app "$PYBIN" -m flask run --port "$FLASK_PORT"
