#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "→ Starting Vite dev server..."
cd "$ROOT/frontend"

if [ ! -d "node_modules" ]; then
  echo "  No node_modules found — running npm install..."
  npm install
fi

npm run dev
