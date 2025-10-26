# Data Collection & Model Training - Quick Start

## 📋 Overview

This guide walks through collecting Zig documentation and preparing the dataset for fine-tuning a specialized Zig language model.

## 🚀 Quick Start

### Step 1: Scrape Zig Documentation

```bash
# Run the documentation scraper
pnpm run scrape-docs

# Or directly with node
node scripts/scrape-zig-docs.js
```

**What it does**:
- Downloads Zig 0.13, 0.14, 0.15 documentation
- Extracts code examples + explanations
- Creates structured training dataset
- Generates statistics report

**Output** (in `data/zig-docs/`):
```
zig-0.15.0-dataset.json      # Latest version examples
zig-0.14.0-dataset.json      # Previous version
zig-0.13.0-dataset.json      # Older version
zig-combined-dataset.json    # All versions merged
dataset-stats.json           # Dataset statistics
```

### Step 2: Review Dataset

```bash
# Check statistics
cat data/zig-docs/dataset-stats.json

# Preview some examples
head -n 50 data/zig-docs/zig-combined-dataset.json
```

**Expected statistics**:
- Total examples: 5,000-10,000
- Version coverage: 33% each (0.13, 0.14, 0.15)
- Difficulty: 40% easy, 40% medium, 20% hard
- Topics: Functions, Structs, Errors, Generics, Comptime, etc.

### Step 3: Validate Examples (Optional)

```bash
# Create validation script
node scripts/validate-dataset.js
```

Uses ZigNet's parser to verify syntax correctness.

---

## 📊 Dataset Format

Each training example follows this structure:

```json
{
  "instruction": "Write Zig 0.15 code for: Error Handling",
  "context": "In Zig, errors are handled explicitly using error unions...",
  "response": "fn divide(a: i32, b: i32) !f32 {\n    if (b == 0) return error.DivisionByZero;\n    return @intToFloat(f32, a) / @intToFloat(f32, b);\n}",
  "metadata": {
    "version": "0.15.0",
    "topic": "Error Handling",
    "difficulty": "medium"
  }
}
```

---

## 🎯 Model Selection

Based on benchmark tests (see `scripts/test-results/`):

| Model                  | Pass Rate  | Avg Time | Recommendation   |
| ---------------------- | ---------- | -------- | ---------------- |
| **Qwen2.5-Coder-7B** ✅ | 6/6 (100%) | 29.58s   | **SELECTED**     |
| DeepSeek-Coder-6.7B    | 6/6 (100%) | 27.86s   | Good alternative |
| CodeLlama-7B           | 6/6 (100%) | ~30s     | Viable option    |

**Why Qwen2.5-Coder-7B?**
- Best out-of-the-box Zig understanding
- Strong code generation
- Active development
- Good balance of size/performance

---

## 🔧 Next Steps

### Option A: Fine-Tune Locally (Requires GPU)

1. **Setup environment**:
   ```bash
   pip install torch transformers peft datasets bitsandbytes accelerate
   ```

2. **Run training**:
   ```bash
   python scripts/train-zig-model.py
   ```

3. **Upload to HuggingFace**:
   ```bash
   python scripts/upload-model.py
   ```

See `docs/FINE_TUNING.md` for detailed instructions.

### Option B: Fine-Tune on Cloud (Recommended)

1. Open Google Colab notebook: `notebooks/zig_finetuning.ipynb`
2. Upload dataset from `data/zig-docs/`
3. Run training cells (3-6 hours on A100)
4. Download fine-tuned model
5. Convert to GGUF for node-llama-cpp

**Cost**: ~$10-20 (Colab Pro subscription)

---

## 📚 Dataset Augmentation (Advanced)

To improve dataset quality:

### 1. Add Community Examples

```bash
# Clone popular Zig projects
git clone https://github.com/ziglang/zig.git temp/zig-stdlib

# Extract patterns
node scripts/extract-zig-patterns.js temp/zig-stdlib
```

### 2. Generate Synthetic Variants

```bash
# Create variations of existing examples
node scripts/augment-dataset.js
```

**Techniques**:
- Variable renaming
- Type substitution (i32 → i64, u32 → usize)
- Add/remove error handling
- Change comptime/runtime variants

### 3. Create Error-Correction Pairs

```bash
# Generate common mistakes → fixes
node scripts/generate-error-pairs.js
```

Examples:
- Type mismatches
- Missing `try` keywords
- Undefined variables
- Wrong comptime usage

---

## 🧪 Testing Dataset Quality

### Automated Validation

```bash
# Check syntax of all code examples
node scripts/validate-dataset.js

# Test model on validation set
node scripts/test-model-on-dataset.js
```

### Manual Review Checklist

- [ ] No deprecated syntax (Zig evolves fast!)
- [ ] Version-specific features tagged correctly
- [ ] Examples are idiomatic Zig
- [ ] No copy-paste from other languages
- [ ] Error handling is explicit
- [ ] Memory management is clear

---

## 🔄 Updating for New Zig Versions

When Zig 0.16 releases:

1. **Update scraper**:
   ```javascript
   // scripts/scrape-zig-docs.js
   const ZIG_VERSIONS = ['0.16.0', '0.15.0', '0.14.0']; // Keep last 3
   ```

2. **Run scraper**:
   ```bash
   pnpm run scrape-docs
   ```

3. **Merge with existing data**:
   ```bash
   node scripts/merge-datasets.js
   ```

4. **Incremental fine-tuning** (faster than full retrain):
   ```bash
   python scripts/train-zig-model.py --incremental --base-model fulgidus/zignet-qwen-7b
   ```

5. **Upload new version**:
   ```bash
   python scripts/upload-model.py --version 0.16
   ```

---

## 📈 Monitoring & Metrics

Track dataset quality over time:

```bash
# Generate quality report
node scripts/dataset-quality-report.js
```

**Metrics**:
- Code validity rate (should be 100%)
- Topic coverage
- Difficulty distribution
- Version balance
- Example length distribution

---

## 🆘 Troubleshooting

### Issue: Scraper fails on large pages

**Solution**: Increase memory limit
```bash
NODE_OPTIONS=--max-old-space-size=8192 node scripts/scrape-zig-docs.js
```

### Issue: Dataset too small (< 5000 examples)

**Solutions**:
1. Add community examples (see Augmentation)
2. Generate synthetic variants
3. Include Zig standard library examples

### Issue: Model generates invalid syntax

**Solutions**:
1. Validate all training examples
2. Filter out edge cases
3. Increase training epochs
4. Use stricter validation during generation

---

## 📖 Resources

- [Zig Documentation](https://ziglang.org/documentation/)
- [Fine-Tuning Guide](docs/FINE_TUNING.md)
- [Model Benchmarks](scripts/test-results/)
- [AGENTS.md](AGENTS.md) - Project specification

---

## ✅ Checklist Before Training

- [ ] Scraped all target Zig versions (0.13, 0.14, 0.15)
- [ ] Dataset has 5,000+ examples
- [ ] All code examples validated with parser
- [ ] Dataset split created (train/val/test)
- [ ] Base model selected (Qwen2.5-Coder-7B)
- [ ] GPU environment ready (local or cloud)
- [ ] HuggingFace account created
- [ ] Model card prepared

**Ready to train?** → See `docs/FINE_TUNING.md` 🚀
