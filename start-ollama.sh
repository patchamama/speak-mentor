#!/usr/bin/env bash
# start-ollama.sh — Start Ollama with optimized settings for speak-mentor
#
# Performance flags used:
#   OLLAMA_KEEP_ALIVE=-1          Model stays in VRAM indefinitely (no reloads between pipeline passes)
#   OLLAMA_KV_CACHE_TYPE=q8_0    50% less VRAM with minimal quality loss (requires Flash Attention)
#   OLLAMA_FLASH_ATTENTION=1     Enable Flash Attention (Apple Silicon, NVIDIA Pascal+, AMD ROCm)
#   OLLAMA_NUM_PARALLEL=2        Allow 2 concurrent requests to the same model
#   OLLAMA_MAX_LOADED_MODELS=3   Keep up to 3 models in VRAM simultaneously (64GB+ only)
#
# Key finding from benchmarks (translategemma:12b, M1 Max):
#   - Decode speed is hardware-bound (~25 t/s) and doesn't change across env var combinations
#   - The biggest lever is num_ctx in the request: ctx=2048 → 163 t/s prefill vs 74 t/s at ctx=4096
#   - OLLAMA_MAX_LOADED_MODELS improves multi-model pipelines (no reloads between passes)
#   - Upgrading Ollama to 0.19+ (MLX backend) gives +93% decode on Apple Silicon over Metal

set -euo pipefail

OLLAMA_PORT=11434

# ── 1. Stop any running Ollama instance ───────────────────────────────────────
echo "Stopping existing Ollama instance..."

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

# ── 2. Detect hardware and set optimal flags ──────────────────────────────────
USE_FLASH=1
KV_CACHE=q8_0
NUM_PARALLEL=2
MAX_LOADED=2

if [[ "$(uname)" == "Darwin" ]]; then
  if [[ "$(uname -m)" != "arm64" ]]; then
    echo "Intel Mac detected — disabling Flash Attention and KV cache quantization"
    USE_FLASH=0
    KV_CACHE=f16
    NUM_PARALLEL=1
    MAX_LOADED=1
  else
    # Detect RAM to tune parallelism and loaded models
    RAM_GB=$(sysctl hw.memsize 2>/dev/null | awk '{printf "%d", $2/1073741824}')
    CHIP=$(system_profiler SPDisplaysDataType 2>/dev/null | grep "Chipset Model" | awk -F': ' '{print $2}' | head -1)
    echo "Apple Silicon detected (${CHIP}, ${RAM_GB}GB) — enabling Flash Attention + KV cache q8_0"
    if [[ "${RAM_GB}" -ge 64 ]]; then
      NUM_PARALLEL=2
      MAX_LOADED=3
      echo "64GB+ RAM: MAX_LOADED_MODELS=3, NUM_PARALLEL=2"
    elif [[ "${RAM_GB}" -ge 32 ]]; then
      NUM_PARALLEL=2
      MAX_LOADED=2
      echo "32GB RAM: MAX_LOADED_MODELS=2, NUM_PARALLEL=2"
    else
      NUM_PARALLEL=1
      MAX_LOADED=1
      echo "16GB RAM: MAX_LOADED_MODELS=1, NUM_PARALLEL=1 (memory-constrained)"
    fi
  fi
elif command -v nvidia-smi &>/dev/null; then
  echo "NVIDIA GPU detected — enabling Flash Attention + KV cache q8_0"
else
  echo "No GPU detected — disabling Flash Attention and KV cache quantization"
  USE_FLASH=0
  KV_CACHE=f16
  NUM_PARALLEL=1
  MAX_LOADED=1
fi

# ── 3. Start Ollama ───────────────────────────────────────────────────────────
echo ""
echo "Starting Ollama..."
echo "  OLLAMA_HOST             = 0.0.0.0:11434"
echo "  OLLAMA_ORIGINS          = *"
echo "  OLLAMA_KEEP_ALIVE       = -1 (indefinite)"
echo "  OLLAMA_NUM_PARALLEL     = ${NUM_PARALLEL}"
echo "  OLLAMA_MAX_LOADED_MODELS= ${MAX_LOADED}"
echo "  OLLAMA_FLASH_ATTN       = ${USE_FLASH}"
echo "  OLLAMA_KV_CACHE         = ${KV_CACHE}"
echo ""
echo "Tip: keep num_ctx ≤ 4096 in requests — smaller context = faster prefill."
echo "     ctx=2048 → ~2x faster prefill vs ctx=4096 with no quality loss for short texts."
echo ""

OLLAMA_HOST=0.0.0.0:11434 \
OLLAMA_ORIGINS="*" \
OLLAMA_KEEP_ALIVE=-1 \
OLLAMA_NUM_PARALLEL=${NUM_PARALLEL} \
OLLAMA_MAX_LOADED_MODELS=${MAX_LOADED} \
OLLAMA_FLASH_ATTENTION=${USE_FLASH} \
OLLAMA_KV_CACHE_TYPE=${KV_CACHE} \
ollama serve
