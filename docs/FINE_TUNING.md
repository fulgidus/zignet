# Fine-Tuning Pipeline for ZigNet

## Overview

This document outlines the process for fine-tuning a code LLM specifically for Zig language expertise to power ZigNet's `get_zig_docs` and `suggest_fix` tools.

## Model Selection

Based on benchmark results from `scripts/test-results/`:

| Model                | Pass Rate  | Avg Time | Recommendation      |
| -------------------- | ---------- | -------- | ------------------- |
| **Qwen2.5-Coder-7B** | 6/6 (100%) | 29.58s   | ✅ **BEST CHOICE**   |
| DeepSeek-Coder-6.7B  | 6/6 (100%) | 27.86s   | ✅ Good alternative  |
| CodeLlama-7B         | 6/6 (100%) | ~30s     | ✅ Viable option     |
| Llama3.2-3B          | 6/6 (100%) | ~28s     | ⚠️ Smaller, faster   |
| Mistral-7B           | Variable   | ~30s     | ⚠️ Less code-focused |

**Selected**: **Qwen2.5-Coder-7B**
- Excellent Zig understanding out-of-the-box
- Strong code generation capabilities
- Good balance of size/performance
- Active development and support

---

## Phase 1: Data Collection

### 1.1 Run Documentation Scraper

```bash
cd /home/fulgidus/Projects/zignet
node scripts/scrape-zig-docs.js
```

**Output**:
- `data/zig-docs/zig-0.15.0-dataset.json`
- `data/zig-docs/zig-0.14.0-dataset.json`
- `data/zig-docs/zig-0.13.0-dataset.json`
- `data/zig-docs/zig-combined-dataset.json`
- `data/zig-docs/dataset-stats.json`

### 1.2 Dataset Format

```json
{
  "instruction": "Write Zig 0.15 code for: Error Handling",
  "context": "Zig uses error unions for explicit error handling...",
  "response": "const MyError = error{InvalidInput};\n\nfn divide(a: i32, b: i32) !f32 {\n    if (b == 0) return error.DivisionByZero;\n    return @intToFloat(f32, a) / @intToFloat(f32, b);\n}",
  "metadata": {
    "version": "0.15.0",
    "topic": "Error Handling",
    "difficulty": "medium"
  }
}
```

### 1.3 Dataset Augmentation

Create additional examples from:
1. **Zig Standard Library**: Extract common patterns
2. **Community projects**: Parse popular Zig repos
3. **Synthetic examples**: Generate variants of existing code
4. **Error correction pairs**: Common mistakes → fixes

**Target**: 10,000+ high-quality instruction-response pairs

---

## Phase 2: Dataset Preparation

### 2.1 Clean and Validate

```bash
# Create cleaning script
node scripts/clean-dataset.js
```

Tasks:
- Remove duplicates
- Validate Zig syntax (use our parser!)
- Filter out deprecated syntax
- Balance difficulty levels
- Ensure version coverage

### 2.2 Split Dataset

```
Training:   70% (7,000 examples)
Validation: 15% (1,500 examples)
Test:       15% (1,500 examples)
```

### 2.3 Convert to Training Format

For **LoRA fine-tuning** (recommended for efficiency):

```json
{
  "text": "<|system|>\nYou are a Zig programming expert for version 0.15.0.\n<|user|>\nWrite Zig code for: Error Handling\nContext: Zig uses error unions for explicit error handling...\n<|assistant|>\nconst MyError = error{InvalidInput};\n\nfn divide(a: i32, b: i32) !f32 {\n    if (b == 0) return error.DivisionByZero;\n    return @intToFloat(f32, a) / @intToFloat(f32, b);\n}"
}
```

---

## Phase 3: Fine-Tuning

### 3.1 Environment Setup

```bash
# Install dependencies
pip install torch transformers peft datasets bitsandbytes accelerate

# Or use Google Colab with GPU
```

### 3.2 Training Configuration

**Method**: QLoRA (Quantized Low-Rank Adaptation)
- Memory efficient (fits on 24GB GPU)
- Fast training (few hours)
- Preserves base model quality

**Hyperparameters**:
```python
training_args = {
    "model_name": "Qwen/Qwen2.5-Coder-7B-Instruct",
    "lora_r": 16,
    "lora_alpha": 32,
    "lora_dropout": 0.05,
    "learning_rate": 2e-4,
    "num_epochs": 3,
    "batch_size": 4,
    "gradient_accumulation_steps": 4,
    "warmup_steps": 100,
    "max_seq_length": 2048,
}
```

### 3.3 Training Script

```python
# scripts/train-zig-model.py
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from datasets import load_dataset
import torch

# Load base model
model = AutoModelForCausalLM.from_pretrained(
    "Qwen/Qwen2.5-Coder-7B-Instruct",
    load_in_4bit=True,
    device_map="auto",
)

# Configure LoRA
lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
)

model = prepare_model_for_kbit_training(model)
model = get_peft_model(model, lora_config)

# Load dataset
dataset = load_dataset("json", data_files="data/zig-docs/zig-combined-dataset.json")

# Train
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
    eval_dataset=dataset["validation"],
)

trainer.train()
```

### 3.4 Training Monitoring

- Loss curve: Should decrease smoothly
- Validation metrics: Monitor perplexity
- Sample generation: Test on held-out examples
- Early stopping: If validation loss plateaus

---

## Phase 4: Model Validation

### 4.1 Automated Tests

Run benchmark suite:
```bash
node scripts/test-model-advanced.js fulgidus/zignet-qwen-7b
```

**Success Criteria**:
- Pass rate: ≥ 95% (better than base model)
- Response time: < 30s average
- Zig syntax validity: 100%
- Version-specific accuracy: > 90%

### 4.2 Manual Review

Test edge cases:
- Comptime evaluation
- Generic functions
- Error unions
- Async/await
- Build system features

---

## Phase 5: HuggingFace Upload

### 5.1 Prepare Model Card

```markdown
---
language:
- zig
license: wtfpl
tags:
- code
- zig
- programming
- fine-tuned
base_model: Qwen/Qwen2.5-Coder-7B-Instruct
---

# ZigNet Qwen 7B - Zig Language Expert

Fine-tuned version of Qwen2.5-Coder-7B specifically for Zig programming language (versions 0.13-0.15).

## Usage

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

model = AutoModelForCausalLM.from_pretrained("fulgidus/zignet-qwen-7b")
tokenizer = AutoTokenizer.from_pretrained("fulgidus/zignet-qwen-7b")

prompt = "Write a Zig function that handles errors"
inputs = tokenizer(prompt, return_tensors="pt")
outputs = model.generate(**inputs, max_length=512)
print(tokenizer.decode(outputs[0]))
```

## Training Data

- 10,000+ Zig code examples from official documentation
- Covers Zig 0.13, 0.14, 0.15
- Balanced across difficulty levels and topics

## Performance

- Benchmark: 100% pass rate on Zig-specific tasks
- Syntax accuracy: 100%
- Average response time: 25s
```

### 5.2 Upload

```bash
huggingface-cli login
huggingface-cli repo create zignet-qwen-7b --type model

python scripts/upload-model.py
```

---

## Phase 6: Integration with ZigNet

### 6.1 Update node-llama-cpp Integration

```typescript
// src/llm/zig-expert.ts
import { LlamaModel, LlamaContext } from 'node-llama-cpp';

export class ZigExpertLLM {
  private model: LlamaModel;
  private context: LlamaContext;

  async init() {
    // Download from HuggingFace
    this.model = await LlamaModel.load({
      modelPath: 'models/zignet-qwen-7b.gguf', // Convert to GGUF
      gpuLayers: 33, // Adjust based on GPU
    });
    
    this.context = await this.model.createContext();
  }

  async getDocs(topic: string): Promise<string> {
    const prompt = `Explain ${topic} in Zig 0.15`;
    return await this.context.evaluate(prompt);
  }

  async suggestFix(error: string, code: string): Promise<string> {
    const prompt = `Fix this Zig error:\n${error}\n\nCode:\n${code}`;
    return await this.context.evaluate(prompt);
  }
}
```

### 6.2 Model Format Conversion

Convert to GGUF for node-llama-cpp:
```bash
python scripts/convert-to-gguf.py \
  --model fulgidus/zignet-qwen-7b \
  --output models/zignet-qwen-7b.gguf \
  --quantize q4_k_m
```

---

## Maintenance & Updates

### When New Zig Version Released

1. **Update scraper** with new version URL
2. **Run scraper**: `node scripts/scrape-zig-docs.js`
3. **Merge datasets**: Combine with existing data
4. **Incremental training**: Fine-tune on new data only (faster)
5. **Validate**: Run benchmark suite
6. **Upload**: Push to HuggingFace
7. **Update ZigNet**: Download new model

### Monitoring Model Quality

- Track user feedback in MCP conversations
- Log failed generations
- Periodic re-evaluation on test set
- Version-specific accuracy tracking

---

## Cost & Resources

### Training Costs (Estimated)

- **Google Colab Pro**: ~$10/month (A100 GPU)
- **RunPod/Lambda**: ~$1/hour (A100 80GB)
- **Training time**: 3-6 hours
- **Total cost**: < $20 per iteration

### Storage

- Base model: ~15GB
- Fine-tuned model: +500MB (LoRA adapters)
- GGUF quantized: ~4GB
- Dataset: ~50MB

### Inference

- GPU: RTX 3060 (12GB) or better
- CPU: Possible but slow (2-3 minutes/response)
- Recommended: M1/M2 Mac or modern GPU

---

## Alternative: Distillation (Future)

If fine-tuned model is too large:

1. Use fine-tuned Qwen-7B as **teacher**
2. Distill to **Phi-2.7B** (student)
3. Result: Faster, smaller model (3GB vs 15GB)
4. Trade-off: Slight quality decrease

---

## Resources

- [Qwen2.5-Coder](https://huggingface.co/Qwen/Qwen2.5-Coder-7B-Instruct)
- [PEFT Documentation](https://huggingface.co/docs/peft)
- [Zig Documentation](https://ziglang.org/documentation/)
- [node-llama-cpp](https://github.com/withcatai/node-llama-cpp)
