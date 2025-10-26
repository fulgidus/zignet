#!/bin/bash
# Convert merged model to GGUF format and import to Ollama

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MERGED_DIR="$PROJECT_ROOT/models/zignet-qwen-7b/merged"
GGUF_DIR="$PROJECT_ROOT/models/zignet-qwen-7b/gguf"

echo "🔄 Converting ZigNet model to GGUF format"

# Check if merged model exists
if [ ! -d "$MERGED_DIR" ]; then
    echo "❌ Merged model not found at: $MERGED_DIR"
    echo "   Run first: pnpm run merge-lora"
    exit 1
fi

# Create GGUF directory
mkdir -p "$GGUF_DIR"

# Check if llama.cpp exists
if [ ! -d "$PROJECT_ROOT/llama.cpp" ]; then
    echo "📥 Cloning llama.cpp..."
    cd "$PROJECT_ROOT"
    git clone https://github.com/ggerganov/llama.cpp
    cd llama.cpp
    
    echo "🔨 Building llama.cpp with CMake..."
    cmake -B build -S llama.cpp -DGGML_CUDA=OFF -DLLAMA_CURL=OFF -DCMAKE_BUILD_TYPE=Release
    cmake --build llama.cpp/build --config Release --target llama-quantize -j$(nproc)
else
    echo "✅ llama.cpp already exists"
    
    # Check if build exists, otherwise build
    if [ ! -f "llama.cpp/build/bin/llama-quantize" ]; then
        echo "🔨 Building llama.cpp with CMake..."
        cmake -B llama.cpp/build -S llama.cpp -DGGML_CUDA=OFF -DLLAMA_CURL=OFF -DCMAKE_BUILD_TYPE=Release
        cmake --build llama.cpp/build --config Release --target llama-quantize -j$(nproc)
    fi
fi

cd "$PROJECT_ROOT/llama.cpp"

# Install Python dependencies if needed
if ! python3 -c "import gguf" 2>/dev/null; then
    echo "📦 Installing Python dependencies..."
    pip install -r requirements.txt
fi

# Convert to FP16 GGUF first
echo "🔄 Converting to FP16 GGUF..."
python3 convert_hf_to_gguf.py "$MERGED_DIR" \
    --outfile "$GGUF_DIR/zignet-qwen-7b-f16.gguf" \
    --outtype f16

# Quantize to Q4_K_M (optimal quality/size)
echo "🔄 Quantizing to Q4_K_M..."
./build/bin/llama-quantize "$GGUF_DIR/zignet-qwen-7b-f16.gguf" \
    "$GGUF_DIR/zignet-qwen-7b-Q_4_K_M.gguf" \
    Q4_K_M

# Optionally create Q5_K_M (higher quality)
read -p "Create Q5_K_M version too? (slower but better quality) [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Quantizing to Q5_K_M..."
    ./build/bin/llama-quantize "$GGUF_DIR/zignet-qwen-7b-f16.gguf" \
        "$GGUF_DIR/zignet-qwen-7b-q5km.gguf" \
        Q5_K_M
fi

echo ""
echo "✅ Conversion complete!"
echo "   Q4_K_M: $GGUF_DIR/zignet-qwen-7b-Q_4_K_M.gguf"
ls -lh "$GGUF_DIR"/*.gguf

echo ""
echo "⚠️  Next step: Import to Ollama"
echo "   Run: pnpm run import-to-ollama"
