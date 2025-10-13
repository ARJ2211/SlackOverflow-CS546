# scripts/fetch-models.sh
#!/usr/bin/env bash
set -euo pipefail

MODEL_ID="${MODEL_ID:-Xenova/bge-large-en-v1.5}"
TARGET_DIR="${TARGET_DIR:-models/Xenova/bge-large-en-v1.5}"

# install huggingface_hub CLI if not present
if ! command -v huggingface-cli >/dev/null 2>&1; then
  echo "huggingface-cli not found. Installing huggingface_hub[cli]..."
  if command -v python3 >/dev/null 2>&1; then
    python3 -m pip install -U "huggingface_hub[cli]"
  elif command -v python >/dev/null 2>&1; then
    python -m pip install -U "huggingface_hub[cli]"
  else
    echo "Python is required but was not found. Please install Python 3 and re-run."
    exit 1
  fi
fi


mkdir -p "$TARGET_DIR"


huggingface-cli download "$MODEL_ID" \
  --local-dir "$TARGET_DIR" \
  --include "onnx/*" "tokenizer.json" "tokenizer_config.json" \
           "config.json" "special_tokens_map.json" "vocab.txt" "merges.txt"

echo "Model ready at $TARGET_DIR"
