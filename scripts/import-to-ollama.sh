#!/bin/bash
# Import ZigNet GGUF model to Ollama

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GGUF_DIR="$PROJECT_ROOT/models/zignet-qwen-7b/gguf"

echo "🔄 Importing ZigNet to Ollama"

# Check if GGUF exists
GGUF_FILE="$GGUF_DIR/zignet-qwen-7b-Q_4_K_M.gguf"
if [ ! -f "$GGUF_FILE" ]; then
    echo "❌ GGUF file not found: $GGUF_FILE"
    echo "   Run first: pnpm run convert-to-gguf"
    exit 1
fi

# Import to Ollama (using Docker exec since Ollama runs in container)
echo "🔄 Importing to Ollama as 'zignet:latest'..."

# Copy GGUF into Docker container
echo "📦 Copying GGUF to Ollama container..."
docker exec ollama mkdir -p /tmp/zignet
docker cp "$GGUF_FILE" ollama:/tmp/zignet/

# Create Modelfile inside container
echo "📄 Creating Modelfile in container..."
docker exec ollama bash -c 'cat > /tmp/zignet/Modelfile << "MODELFILE_EOF"
FROM /tmp/zignet/zignet-qwen-7b-Q_4_K_M.gguf

TEMPLATE """{{ if .System }}<|im_start|>system
{{ .System }}<|im_end|>
{{ end }}{{ if .Prompt }}<|im_start|>user
{{ .Prompt }}<|im_end|>
{{ end }}<|im_start|>assistant
{{ .Response }}<|im_end|>
"""

SYSTEM """You are ZigNet, an AI assistant specialized in Zig programming language (v0.13-0.15).

Your expertise includes:
- Explaining Zig syntax, features, and idioms
- Understanding comptime, generics, and error handling
- Providing code examples and fixes
- Referencing official Zig documentation

Always:
- Generate idiomatic Zig code
- Explain Zig-specific concepts clearly
- Suggest best practices
- Validate syntax mentally before responding

When unsure, reference official Zig docs or suggest using zig ast-check."""

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER repeat_penalty 1.1
PARAMETER num_ctx 4096
PARAMETER stop "<|im_start|>"
PARAMETER stop "<|im_end|>"

LICENSE """
Apache License 2.0
Base model: Qwen/Qwen2.5-Coder-7B-Instruct
Fine-tuned by: fulgidus
Repository: https://github.com/fulgidus/zignet
"""
MODELFILE_EOF'

# Execute ollama create inside Docker container
docker exec ollama ollama create zignet:latest -f /tmp/zignet/Modelfile

echo ""
echo "✅ Import complete!"
echo ""
echo "🚀 Try it now:"
echo "   ollama run zignet:latest"
echo ""
echo "Example prompts:"
echo '   "Explain comptime in Zig"'
echo '   "Generate a generic ArrayList in Zig"'
echo '   "What are error sets in Zig?"'
