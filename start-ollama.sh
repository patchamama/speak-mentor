#!/usr/bin/env bash
# start-ollama.sh — Start Ollama with optimized settings for speak-mentor
#
# Performance flags used:
#   OLLAMA_KEEP_ALIVE=-1        Model stays in VRAM indefinitely (no reloads between pipeline passes)
#   OLLAMA_KV_CACHE_TYPE=q8_0  50% less VRAM with minimal quality loss (requires Flash Attention)
#   OLLAMA_FLASH_ATTENTION=1   Enable Flash Attention (Apple Silicon, NVIDIA Pascal+, AMD ROCm)
#   OLLAMA_NUM_PARALLEL=2      Allow 2 concurrent requests to the same model

set -euo pipefail

OLLAMA_PORT=11434

# ── 1. Stop any running Ollama instance ───────────────────────────────────────
echo "Stopping existing Ollama instance..."

# Kill the CLI server process
pkill -f "ollama serve" 2>/dev/null || true
pkill -f "ollama runner" 2>/dev/null || true

# On macOS, Ollama also runs as a menu-bar app (Ollama.app) — kill it too
if [[ "$(uname)" == "Darwin" ]]; then
  osascript -e 'quit app "Ollama"' 2>/dev/null || true
  pkill -x "Ollama" 2>/dev/null || true
fi

# Wait until the port is actually free (up to 10 seconds)
for i in $(seq 1 10); do
  if ! lsof -iTCP:${OLLAMA_PORT} -sTCP:LISTEN -t &>/dev/null; then
    break
  fi
  if [[ $i -eq 10 ]]; then
    echo "Port ${OLLAMA_PORT} still in use after 10s. Forcing kill..."
    lsof -iTCP:${OLLAMA_PORT} -sTCP:LISTEN -t 2>/dev/null | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
  sleep 1
done

# ── 2. Detect hardware and set optimal KV cache type ─────────────────────────
# Flash Attention is required for q8_0/q4_0 KV cache quantization.
# It works on Apple Silicon (Metal), NVIDIA Pascal+ and AMD ROCm.
# On CPU-only machines we skip quantization.

USE_FLASH=1
KV_CACHE=q8_0

if [[ "$(uname)" == "Darwin" ]]; then
  # macOS — check for Apple Silicon
  if [[ "$(uname -m)" != "arm64" ]]; then
    echo "Intel Mac detected — disabling Flash Attention and KV cache quantization"
    USE_FLASH=0
    KV_CACHE=f16
  else
    echo "Apple Silicon detected — enabling Flash Attention + KV cache q8_0"
  fi
elif command -v nvidia-smi &>/dev/null; then
  echo "NVIDIA GPU detected — enabling Flash Attention + KV cache q8_0"
else
  echo "No GPU detected — disabling Flash Attention and KV cache quantization"
  USE_FLASH=0
  KV_CACHE=f16
fi

# ── 3. Start Ollama ───────────────────────────────────────────────────────────
echo ""
echo "Starting Ollama..."
echo "  OLLAMA_HOST        = 0.0.0.0:11434"
echo "  OLLAMA_ORIGINS     = *"
echo "  OLLAMA_KEEP_ALIVE  = -1 (indefinite)"
echo "  OLLAMA_NUM_PARALLEL= 2"
echo "  OLLAMA_FLASH_ATTN  = ${USE_FLASH}"
echo "  OLLAMA_KV_CACHE    = ${KV_CACHE}"
echo ""

OLLAMA_HOST=0.0.0.0:11434 \
OLLAMA_ORIGINS="*" \
OLLAMA_KEEP_ALIVE=-1 \
OLLAMA_NUM_PARALLEL=2 \
OLLAMA_FLASH_ATTENTION=${USE_FLASH} \
OLLAMA_KV_CACHE_TYPE=${KV_CACHE} \
ollama serve
