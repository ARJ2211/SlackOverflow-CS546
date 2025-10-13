# scripts/fetch-models.sh
#!/usr/bin/env bash
set -euo pipefail

MODEL_ID="${MODEL_ID:-Xenova/bge-large-en-v1.5}"
TARGET_DIR="${TARGET_DIR:-models/Xenova/bge-large-en-v1.5}"

# install huggingface_hub CLI if not present
python3 -m pip install -U "huggingface_hub[cli]"

mkdir -p "$TARGET_DIR"


hf download "$MODEL_ID" \
  --local-dir "$TARGET_DIR" \
  --include "onnx/*" "tokenizer.json" "tokenizer_config.json" \
           "config.json" "special_tokens_map.json" "vocab.txt" "merges.txt"

echo "Model ready at $TARGET_DIR"
