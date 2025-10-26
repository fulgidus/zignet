# ZigNet Training Guide

Complete guide for fine-tuning Qwen2.5-Coder-7B on your RTX 3090.

---

## 🖥️ Hardware Requirements

### ✅ Your Setup
- **GPU**: NVIDIA RTX 3090 (24GB VRAM)
- **CPU**: AMD Ryzen 9 7900X3D (12-core/24-thread)
- **RAM**: 30GB
- **CUDA**: 12.7
- **OS**: WSL2 (Ubuntu)

### VRAM Usage Breakdown
- **Base model (4-bit)**: ~4.5GB
- **LoRA adapters**: ~1.5GB
- **Training overhead**: ~6-8GB
- **Gradient checkpointing**: Saves ~2-3GB
- **Total estimated**: ~12-16GB ✅ (fits comfortably in 24GB)

---

## 📦 Installation

### 1. Create Python Virtual Environment

```bash
# From zignet root directory
python3 -m venv venv-train
source venv-train/bin/activate
```

### 2. Install PyTorch with CUDA 12.7

```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

**Note**: Use `cu121` (CUDA 12.1) as it's compatible with CUDA 12.7.

### 3. Install Training Dependencies

```bash
pip install -r requirements-train.txt
```

**Installation time**: ~10-15 minutes

### 4. Verify CUDA Setup

```bash
python -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}'); print(f'GPU: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else None}')"
```

Expected output:
```
CUDA available: True
GPU: NVIDIA GeForce RTX 3090
```

---

## 🚀 Training

### Quick Start

```bash
# Activate virtual environment
source venv-train/bin/activate

# Start training (6-10 hours)
python scripts/train-qwen-unsloth.py
```

### Training Configuration

Edit `scripts/train-qwen-unsloth.py` to customize:

```python
# Performance vs Quality tradeoff
BATCH_SIZE = 4  # Increase to 6-8 if you have VRAM headroom
GRADIENT_ACCUMULATION_STEPS = 4  # Effective batch size = BATCH_SIZE * this
NUM_EPOCHS = 3  # More epochs = better quality (but risk overfitting)

# LoRA parameters
LORA_R = 16  # Increase to 32 for better quality (slower, more VRAM)
LORA_ALPHA = 32  # Keep at 2x LORA_R

# Learning rate
LEARNING_RATE = 2e-4  # Decrease to 1e-4 if loss is unstable
```

### Expected Timeline

| Phase         | Duration       | Activity                    |
| ------------- | -------------- | --------------------------- |
| Model loading | 2-3 min        | Download & load 4-bit model |
| Dataset prep  | 1 min          | Load 13,756 examples        |
| Epoch 1       | 2-3 hours      | Initial training            |
| Epoch 2       | 2-3 hours      | Refinement                  |
| Epoch 3       | 2-3 hours      | Final tuning                |
| Saving        | 5-10 min       | Merge LoRA + save           |
| **Total**     | **6-10 hours** |                             |

### Monitoring Progress

The script prints progress every 10 steps:

```
Step 100/2850 | Loss: 1.234 | LR: 0.0002 | Time: 2.5s/step
Step 200/2850 | Loss: 1.156 | LR: 0.0002 | Time: 2.4s/step
...
```

**Good signs**:
- Loss decreasing steadily
- Eval loss lower than train loss (no overfitting)
- Speed: 2-3 seconds per step

**Warning signs**:
- Loss increasing or flat → reduce learning rate
- Eval loss > train loss → reduce epochs or add dropout
- OOM errors → reduce BATCH_SIZE to 2

### Checkpoints

Models are saved every 500 steps:

```
models/zignet-qwen-7b/
├── checkpoint-500/
├── checkpoint-1000/
├── checkpoint-1500/
└── ...
```

If training crashes, resume with:

```python
# In train-qwen-unsloth.py, add:
resume_from_checkpoint = "models/zignet-qwen-7b/checkpoint-1500"
```

---

## 🧪 Evaluation

### Automatic Test (End of Training)

The script runs 3 test prompts automatically:

```
[TEST 1] Write a Zig function to add two integers
[RESPONSE]
pub fn add(a: i32, b: i32) i32 {
    return a + b;
}
```

### Manual Testing

```python
from unsloth import FastLanguageModel

model, tokenizer = FastLanguageModel.from_pretrained(
    "models/zignet-qwen-7b/merged",
    max_seq_length=2048,
    dtype=None,
    load_in_4bit=False,  # Merged model is in float16
)

FastLanguageModel.for_inference(model)

prompt = """### Instruction:
Write a Zig allocator wrapper with error handling

### Response:
"""

inputs = tokenizer(prompt, return_tensors="pt").to("cuda")
outputs = model.generate(**inputs, max_new_tokens=512)
print(tokenizer.decode(outputs[0], skip_special_tokens=True))
```

### Benchmarking

Compare against base model:

```bash
# Test original Qwen2.5-Coder-7B
python scripts/test-model-advanced.js qwen2.5-coder:7b

# Test fine-tuned model (after GGUF conversion)
python scripts/test-model-advanced.js zignet-qwen-7b
```

Expected improvements:
- ✅ Better Zig syntax (modern idioms)
- ✅ Proper `comptime` usage
- ✅ Correct error handling patterns
- ✅ Idiomatic struct/enum definitions

---

## 💾 Saving & Deployment

### Output Files

After training:

```
models/zignet-qwen-7b/
├── lora_adapters/          # LoRA weights only (~500MB)
│   ├── adapter_config.json
│   └── adapter_model.safetensors
├── merged/                 # Full model (base + LoRA, ~15GB)
│   ├── config.json
│   ├── model.safetensors
│   └── tokenizer files
└── training_stats.json     # Metrics & hyperparameters
```

### Upload to HuggingFace

```bash
# Set your token
export HF_TOKEN="hf_your_token_here"

# In train-qwen-unsloth.py, set:
PUSH_TO_HUB = True
HF_USERNAME = "fulgidus"
HF_MODEL_NAME = "zignet-qwen2.5-coder-7b"

# Re-run (will skip training, just upload)
python scripts/train-qwen-unsloth.py
```

Or manually:

```bash
pip install huggingface-hub
huggingface-cli login

cd models/zignet-qwen-7b/merged
huggingface-cli upload fulgidus/zignet-qwen2.5-coder-7b . --repo-type model
```

### Convert to GGUF (for node-llama-cpp)

```bash
# Install llama.cpp
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make

# Convert to GGUF
python convert.py ../zignet/models/zignet-qwen-7b/merged \
  --outtype f16 \
  --outfile ../zignet/models/zignet-qwen-7b.gguf

# Quantize to Q4_K_M (recommended)
./quantize ../zignet/models/zignet-qwen-7b.gguf \
  ../zignet/models/zignet-qwen-7b-Q4_K_M.gguf Q4_K_M
```

Quantization options:
- **Q4_K_M**: Best balance (4GB, ~95% quality) ⭐
- **Q5_K_M**: Higher quality (5GB, ~98% quality)
- **Q8_0**: Max quality (8GB, ~99% quality)

---

## 🔧 Troubleshooting

### CUDA Out of Memory

```
RuntimeError: CUDA out of memory
```

**Solutions**:
1. Reduce `BATCH_SIZE` from 4 to 2
2. Increase `GRADIENT_ACCUMULATION_STEPS` to 8
3. Enable `USE_GRADIENT_CHECKPOINTING = True`
4. Reduce `MAX_SEQ_LENGTH` from 2048 to 1536

### Slow Training

**Current speed**: 2-3 seconds/step  
**If slower**:

1. Check GPU utilization: `watch -n 1 nvidia-smi`
   - Should be 90-100% during training
2. Disable CPU bottlenecks:
   - Set `dataloader_num_workers=4` in TrainingArguments
3. Verify flash attention: `USE_FLASH_ATTENTION = True`

### Model Quality Issues

**Symptoms**:
- Generates invalid Zig syntax
- Ignores instruction
- Repeats text

**Fixes**:
1. **Increase epochs**: 3 → 5
2. **Increase LoRA rank**: 16 → 32
3. **Better prompts**: Review dataset quality
4. **Lower learning rate**: 2e-4 → 1e-4

### Installation Errors

**Unsloth installation fails**:

```bash
# Install dependencies manually
pip install packaging ninja
pip install flash-attn --no-build-isolation

# Retry Unsloth
pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
```

**PyTorch CUDA mismatch**:

```bash
# Uninstall all PyTorch
pip uninstall torch torchvision torchaudio -y

# Reinstall with correct CUDA
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

---

## 📊 Performance Expectations

### Training Metrics (Target)

| Metric     | Initial | After Epoch 1 | Final (Epoch 3) |
| ---------- | ------- | ------------- | --------------- |
| Train Loss | ~2.5    | ~1.2          | ~0.8            |
| Eval Loss  | ~2.3    | ~1.1          | ~0.9            |
| Perplexity | ~12     | ~3            | ~2.5            |

### Quality Benchmarks

Test on these prompts and expect:

1. **Simple function**: 95%+ correct syntax
2. **Generics**: 85%+ proper `comptime` usage
3. **Error handling**: 90%+ idiomatic `try`/`catch`
4. **Memory management**: 80%+ correct allocator patterns

### Speed Comparison

| Framework                 | Training Time  | Speed      |
| ------------------------- | -------------- | ---------- |
| **Unsloth** (this script) | **6-10 hours** | **1.0x** ⭐ |
| Standard TRL              | 12-20 hours    | 0.5x       |
| DeepSpeed                 | 8-12 hours     | 0.75x      |
| Colab Pro (A100)          | 4-6 hours      | 1.5x       |

---

## 🎯 Next Steps After Training

1. ✅ **Review stats**: `models/zignet-qwen-7b/training_stats.json`
2. ✅ **Test inference**: Run manual prompts
3. ✅ **Convert to GGUF**: For MCP server integration
4. ✅ **Upload to HuggingFace**: Share with community
5. ✅ **Integrate with ZigNet**: Use in MCP tools (`get_zig_docs`, `suggest_fix`)

---

## 📚 References

- [Unsloth Documentation](https://github.com/unslothai/unsloth)
- [QLoRA Paper](https://arxiv.org/abs/2305.14314)
- [Qwen2.5-Coder Model Card](https://huggingface.co/Qwen/Qwen2.5-Coder-7B-Instruct)
- [LoRA Paper](https://arxiv.org/abs/2106.09685)
