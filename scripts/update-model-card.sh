#!/bin/bash
# Update Model Card on HuggingFace with GGUF instructions

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
README_FILE="$PROJECT_ROOT/models/zignet-qwen-7b/final/README.md"
MODEL_REPO="fulgidus/zignet-qwen2.5-coder-7b"

echo "📝 Updating Model Card on HuggingFace"
echo ""

# Check if README exists
if [ ! -f "$README_FILE" ]; then
    echo "❌ README not found: $README_FILE"
    exit 1
fi

# Check HuggingFace CLI
if ! command -v hf &> /dev/null; then
    echo "❌ hf not found"
    exit 1
fi

# Add GGUF section to README if not present
if ! grep -q "### With GGUF" "$README_FILE"; then
    echo "➕ Adding GGUF section to README..."
    
    # Find line after "print(response)" and insert GGUF section
    awk '/^print\(response\)$/ {
        print
        print ""
        print "### With GGUF (Ollama, llama.cpp, etc.)"
        print ""
        print "**Quantized GGUF version** available for local inference:"
        print ""
        print "```bash"
        print "# Download GGUF (4.4GB Q4_K_M)"
        print "huggingface-cli download fulgidus/zignet-qwen2.5-coder-7b \\"
        print "    gguf/zignet-qwen-7b-q4km.gguf --local-dir ./models"
        print ""
        print "# Use with Ollama"
        print "ollama create zignet -f <(cat << EOF"
        print "FROM ./models/gguf/zignet-qwen-7b-q4km.gguf"
        print "SYSTEM \"\"\"You are ZigNet, specialized in Zig programming.\"\"\""
        print "PARAMETER temperature 0.7"
        print "PARAMETER num_ctx 4096"
        print "EOF"
        print ")"
        print ""
        print "ollama run zignet \"Explain comptime in Zig\""
        print "```"
        print ""
        print "**Benefits**: 4.4GB (vs 15GB), GPU accelerated, ~95% quality retention"
        next
    }
    {print}' "$README_FILE" > "$README_FILE.tmp"
    
    mv "$README_FILE.tmp" "$README_FILE"
    echo "✅ GGUF section added"
else
    echo "ℹ️  GGUF section already present"
fi

# Upload to HuggingFace
echo ""
echo "📤 Uploading README to $MODEL_REPO..."
hf upload "$MODEL_REPO" \
    "$README_FILE" \
    README.md \
    --repo-type model

echo ""
echo "✅ Model Card updated!"
echo "🔗 View at: https://huggingface.co/$MODEL_REPO"
