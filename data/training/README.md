---
language:
- en
license: apache-2.0
tags:
- zig
- code
- programming
- dataset
size_categories:
- 10K<n<100K
task_categories:
- text-generation
- question-answering
---

# ZigNet Training Dataset

**Curated dataset of Zig programming examples for LLM fine-tuning**

This dataset was created for the [ZigNet](https://github.com/fulgidus/zignet) project to train language models on Zig programming language patterns, idioms, and documentation.

## Dataset Description

- **Total Examples**: 13,756
- **Source**: Official Zig documentation (v0.13, v0.14, v0.15)
- **Format**: JSONL (instruction-response pairs)
- **Language**: English
- **Zig Versions**: 0.13.0, 0.14.1, 0.15.1

## Dataset Structure

### Files

```
data/training/
├── dataset-train.jsonl       # 9,629 examples (70%)
├── dataset-validation.jsonl  # 2,063 examples (15%)
├── dataset-test.jsonl        # 2,064 examples (15%)
└── dataset-stats.json        # Dataset statistics
```

### Data Fields

Each example is a JSON object with:

```json
{
  "instruction": "Explain this Zig code feature",
  "input": "const x: i32 = 42;",
  "output": "This declares a constant variable `x` of type `i32` (32-bit signed integer) with value 42..."
}
```

**Fields**:
- `instruction`: Task description (explain/analyze/generate Zig code)
- `input`: Zig code snippet or context
- `output`: Expected response (explanation, corrected code, documentation)

## Dataset Statistics

| Split      | Examples   | Size     |
| ---------- | ---------- | -------- |
| Train      | 9,629      | ~4.2MB   |
| Validation | 2,063      | ~900KB   |
| Test       | 2,064      | ~900KB   |
| **Total**  | **13,756** | **~6MB** |

### Version Distribution

- **Zig 0.13.x**: ~4,200 examples
- **Zig 0.14.x**: ~4,700 examples  
- **Zig 0.15.x**: ~4,856 examples

### Topic Coverage

- ✅ Variables and types (const, var, comptime)
- ✅ Functions and control flow
- ✅ Structs, enums, unions
- ✅ Generics and comptime programming
- ✅ Error handling (error sets, try, catch)
- ✅ Memory management (allocators, defer)
- ✅ Pointers and slices
- ✅ Async/await patterns
- ✅ Build system (build.zig)
- ✅ Standard library usage

## Data Collection

### Methodology

1. **Scraping**: Automated extraction from [ziglang.org/documentation](https://ziglang.org/documentation/)
2. **Parsing**: Extract code blocks with surrounding context
3. **Filtering**: Remove duplicates, invalid syntax, incomplete examples
4. **Augmentation**: Add instruction-response pairs for each example
5. **Validation**: Verify all examples compile with respective Zig versions

### Quality Control

- 100% syntax-valid (verified with `zig ast-check`)
- Manually reviewed for semantic correctness
- Deduplicated across versions
- Balanced distribution of difficulty levels

## Intended Use

### Primary Use Cases

- Fine-tuning LLMs for Zig code understanding
- Training code completion models
- Building Zig documentation assistants
- Research in programming language modeling

### Out of Scope

- General-purpose code generation (dataset is Zig-specific)
- Production-critical code without human review
- Zig versions outside 0.13-0.15 range

## Usage

### Loading with Datasets Library

```python
from datasets import load_dataset

# Load full dataset
dataset = load_dataset("fulgidus/zignet-training-dataset")

# Load specific split
train = load_dataset("fulgidus/zignet-training-dataset", split="train")
val = load_dataset("fulgidus/zignet-training-dataset", split="validation")
test = load_dataset("fulgidus/zignet-training-dataset", split="test")
```

### Manual Loading (JSONL)

```python
import json

def load_jsonl(filepath):
    with open(filepath, 'r') as f:
        return [json.loads(line) for line in f]

train_data = load_jsonl("dataset-train.jsonl")
```

### Training Example (Transformers)

```python
from transformers import AutoModelForCausalLM, TrainingArguments, Trainer
from datasets import load_dataset

dataset = load_dataset("fulgidus/zignet-training-dataset")

model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-Coder-7B-Instruct")

training_args = TrainingArguments(
    output_dir="./zignet-model",
    num_train_epochs=3,
    per_device_train_batch_size=16,
    learning_rate=2e-4,
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
    eval_dataset=dataset["validation"],
)

trainer.train()
```

## Versioning

The dataset is versioned to track Zig language evolution:

- **v1.0** (Oct 2025): Zig 0.13-0.15, 13,756 examples
- Future updates will include newer Zig versions as released

## Limitations

- **Version-specific syntax**: Some examples may not work across all Zig versions
- **Documentation-focused**: Real-world production patterns underrepresented
- **English only**: Comments and explanations in English
- **No executable context**: Snippets may require additional imports/setup

## Ethical Considerations

- **Source**: All examples from official Zig documentation (permissive license)
- **Attribution**: Zig project acknowledged (MIT license compatible)
- **Bias**: Dataset reflects official documentation bias toward teaching/examples
- **Privacy**: No user data, only public documentation

## Citation

```bibtex
@dataset{zignet_dataset2025,
  author = {fulgidus},
  title = {ZigNet Training Dataset: Zig Code Examples from Official Documentation},
  year = {2025},
  publisher = {HuggingFace},
  url = {https://huggingface.co/datasets/fulgidus/zignet-training-dataset}
}
```

## License

Apache-2.0 (same as Zig project and base documentation)

## Acknowledgments

- **Zig Language**: [ziglang.org](https://ziglang.org) - Andrew Kelley and contributors
- **Documentation**: Official Zig documentation team
- **Tools**: HuggingFace Datasets, Transformers

---

**Project**: [github.com/fulgidus/zignet](https://github.com/fulgidus/zignet)  
**Model**: [fulgidus/zignet-qwen2.5-coder-7b](https://huggingface.co/fulgidus/zignet-qwen2.5-coder-7b)  
**Author**: fulgidus  
**Date**: October 2025
