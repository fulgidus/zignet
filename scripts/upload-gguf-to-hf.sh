#!/bin/bash
# Upload GGUF model to HuggingFace

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GGUF_FILE="$PROJECT_ROOT/models/zignet-qwen-7b/gguf/zignet-qwen-7b-Q_4_K_M.gguf"
MODEL_REPO="fulgidus/zignet-qwen2.5-coder-7b"

echo "🚀 Uploading GGUF to HuggingFace"
echo ""
echo "📦 File: zignet-qwen-7b-Q_4_K_M.gguf (4.4GB)"
echo "📍 Repo: $MODEL_REPO"
echo ""

# Check if GGUF exists
if [ ! -f "$GGUF_FILE" ]; then
    echo "❌ GGUF file not found: $GGUF_FILE"
    echo "   Run first: pnpm run convert-to-gguf"
    exit 1
fi

# Check HuggingFace CLI
if ! command -v hf &> /dev/null; then
    echo "❌ hf not found"
    echo "   Install: pip install huggingface_hub"
    exit 1
fi

# Confirm upload
echo "⚠️  This will upload 4.4GB to HuggingFace"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Upload cancelled"
    exit 1
fi

echo ""
echo "📤 Uploading GGUF to $MODEL_REPO..."
echo ""

# Upload GGUF file to HuggingFace
hf upload "$MODEL_REPO" \
    "$GGUF_FILE" \
    gguf/zignet-qwen-7b-Q_4_K_M.gguf \
    --repo-type model

echo ""
echo "✅ Upload complete!"
echo ""
echo "🔗 Model available at:"
echo "   https://huggingface.co/$MODEL_REPO"
echo ""
echo "📥 Download with:"
echo "   huggingface-cli download $MODEL_REPO gguf/zignet-qwen-7b-Q_4_K_M.gguf"
echo ""
echo "🐳 Use in Ollama:"
echo "   FROM hf.co/$MODEL_REPO:gguf/zignet-qwen-7b-Q_4_K_M.gguf"
