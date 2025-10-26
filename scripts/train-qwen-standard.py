#!/usr/bin/env python3
"""
ZigNet Fine-Tuning Script - QLoRA Standard (NO Unsloth)
Optimized for RTX 3090 (24GB VRAM)

Usage:
    python scripts/train-qwen-standard.py
    
Environment:
    - CUDA 12.7
    - PyTorch 2.4.1
    - transformers 4.45.2
    - trl 0.11.4
    - peft 0.13.2
    - bitsandbytes 0.44.1
"""

import os
import json
import torch
from datetime import datetime
from datasets import load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer

# ============================================================================
# CONFIGURATION
# ============================================================================

# Model settings
MODEL_NAME = "Qwen/Qwen2.5-Coder-7B-Instruct"
MAX_SEQ_LENGTH = 2048  # Zig code can be long
USE_FLASH_ATTENTION = False  # Flash Attention 2 (requires flash-attn package)

# LoRA hyperparameters
LORA_R = 16  # Rank (higher = more parameters, better quality, slower)
LORA_ALPHA = 32  # Scaling factor (typically 2x rank)
LORA_DROPOUT = 0.05  # Prevent overfitting
LORA_TARGET_MODULES = ["q_proj", "k_proj", "v_proj", "o_proj", 
                        "gate_proj", "up_proj", "down_proj"]  # All attention + MLP

# Training hyperparameters
OUTPUT_DIR = "./models/zignet-qwen-7b"
NUM_EPOCHS = 3
BATCH_SIZE = 4  # Per GPU (RTX 3090 can handle 4-8)
GRADIENT_ACCUMULATION_STEPS = 4  # Effective batch size = 4 * 4 = 16
LEARNING_RATE = 2e-4
WARMUP_STEPS = 100
WEIGHT_DECAY = 0.01
LR_SCHEDULER_TYPE = "cosine"
SAVE_STRATEGY = "steps"
SAVE_STEPS = 500
LOGGING_STEPS = 50
EVAL_STRATEGY = "steps"
EVAL_STEPS = 500
FP16 = True  # Use mixed precision (RTX 3090 supports fp16)

# Dataset paths
TRAIN_DATA = "./data/training/dataset-train.jsonl"
VAL_DATA = "./data/training/dataset-validation.jsonl"
TEST_DATA = "./data/training/dataset-test.jsonl"

# HuggingFace upload (optional)
PUSH_TO_HUB = False
HF_REPO_NAME = "fulgidus/zignet-qwen2.5-coder-7b"

# ============================================================================
# FUNCTIONS
# ============================================================================

def load_training_data():
    """Load and format datasets"""
    print("📂 Loading datasets...")
    
    dataset = load_dataset(
        "json",
        data_files={
            "train": TRAIN_DATA,
            "validation": VAL_DATA,
            "test": TEST_DATA,
        }
    )
    
    print(f"✅ Loaded {len(dataset['train'])} training examples")
    print(f"✅ Loaded {len(dataset['validation'])} validation examples")
    print(f"✅ Loaded {len(dataset['test'])} test examples")
    
    return dataset

def format_prompt_alpaca(example):
    """
    Format dataset example into Alpaca-style prompt
    Expected format in JSONL:
    {
      "instruction": "Explain this Zig code",
      "input": "fn add(a: i32, b: i32) i32 { return a + b; }",
      "output": "This function adds two i32 integers..."
    }
    """
    if example.get("input"):
        prompt = f"""Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
{example['instruction']}

### Input:
{example['input']}

### Response:
{example['output']}"""
    else:
        prompt = f"""Below is an instruction that describes a task. Write a response that appropriately completes the request.

### Instruction:
{example['instruction']}

### Response:
{example['output']}"""
    
    return {"text": prompt}

def setup_model():
    """Setup model with QLoRA (4-bit quantization + LoRA adapters)"""
    print(f"🔧 Loading model: {MODEL_NAME}")
    
    # BitsAndBytes config for 4-bit quantization
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_use_double_quant=True,  # Nested quantization for better compression
        bnb_4bit_quant_type="nf4",  # NormalFloat4 (best for fine-tuning)
        bnb_4bit_compute_dtype=torch.float16,  # Compute in fp16 for speed
    )
    
    # Load model
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        quantization_config=bnb_config,
        device_map="auto",  # Automatic GPU distribution
        trust_remote_code=True,
        attn_implementation="flash_attention_2" if USE_FLASH_ATTENTION else None,
    )
    
    # Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(
        MODEL_NAME,
        trust_remote_code=True,
    )
    tokenizer.pad_token = tokenizer.eos_token  # Qwen uses eos as pad
    tokenizer.padding_side = "right"  # For training stability
    
    # Prepare model for k-bit training (PEFT requirement)
    model = prepare_model_for_kbit_training(model)
    
    # Configure LoRA adapters
    peft_config = LoraConfig(
        r=LORA_R,
        lora_alpha=LORA_ALPHA,
        lora_dropout=LORA_DROPOUT,
        target_modules=LORA_TARGET_MODULES,
        bias="none",
        task_type="CAUSAL_LM",
    )
    
    # Add LoRA adapters to model
    model = get_peft_model(model, peft_config)
    
    # Print trainable parameters
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total_params = sum(p.numel() for p in model.parameters())
    print(f"✅ Model loaded:")
    print(f"   - Total params: {total_params:,}")
    print(f"   - Trainable params: {trainable_params:,} ({100 * trainable_params / total_params:.2f}%)")
    
    return model, tokenizer

def train_model(model, tokenizer, dataset):
    """Train model with SFTTrainer"""
    print("🚀 Starting training...")
    
    # Format datasets
    train_dataset = dataset["train"].map(format_prompt_alpaca, remove_columns=dataset["train"].column_names)
    eval_dataset = dataset["validation"].map(format_prompt_alpaca, remove_columns=dataset["validation"].column_names)
    
    # Training arguments
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        num_train_epochs=NUM_EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        per_device_eval_batch_size=BATCH_SIZE,
        gradient_accumulation_steps=GRADIENT_ACCUMULATION_STEPS,
        learning_rate=LEARNING_RATE,
        warmup_steps=WARMUP_STEPS,
        weight_decay=WEIGHT_DECAY,
        lr_scheduler_type=LR_SCHEDULER_TYPE,
        save_strategy=SAVE_STRATEGY,
        save_steps=SAVE_STEPS,
        logging_steps=LOGGING_STEPS,
        evaluation_strategy=EVAL_STRATEGY,
        eval_steps=EVAL_STEPS,
        fp16=FP16,
        gradient_checkpointing=True,  # Save VRAM at cost of speed
        optim="paged_adamw_8bit",  # Memory-efficient optimizer
        push_to_hub=PUSH_TO_HUB,
        hub_model_id=HF_REPO_NAME if PUSH_TO_HUB else None,
        report_to="none",  # Disable wandb/tensorboard
        save_total_limit=3,  # Keep only last 3 checkpoints
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
    )
    
    # Create trainer
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        max_seq_length=MAX_SEQ_LENGTH,
        dataset_text_field="text",  # Column with formatted prompts
        packing=False,  # Don't pack multiple examples (for clarity)
    )
    
    # Train!
    print(f"📊 Training config:")
    print(f"   - Epochs: {NUM_EPOCHS}")
    print(f"   - Batch size: {BATCH_SIZE}")
    print(f"   - Gradient accumulation: {GRADIENT_ACCUMULATION_STEPS}")
    print(f"   - Effective batch size: {BATCH_SIZE * GRADIENT_ACCUMULATION_STEPS}")
    print(f"   - Learning rate: {LEARNING_RATE}")
    print(f"   - Total training steps: ~{len(train_dataset) * NUM_EPOCHS // (BATCH_SIZE * GRADIENT_ACCUMULATION_STEPS)}")
    print(f"   - Estimated time: 6-10 hours on RTX 3090")
    print()
    
    start_time = datetime.now()
    trainer.train()
    end_time = datetime.now()
    
    training_time = (end_time - start_time).total_seconds() / 3600  # Hours
    print(f"\n✅ Training complete in {training_time:.2f} hours")
    
    # Save final model
    print("💾 Saving model...")
    trainer.save_model(f"{OUTPUT_DIR}/final")
    
    # Save training stats
    stats = {
        "model": MODEL_NAME,
        "training_time_hours": training_time,
        "num_epochs": NUM_EPOCHS,
        "batch_size": BATCH_SIZE,
        "learning_rate": LEARNING_RATE,
        "train_examples": len(train_dataset),
        "eval_examples": len(eval_dataset),
        "lora_r": LORA_R,
        "lora_alpha": LORA_ALPHA,
        "timestamp": datetime.now().isoformat(),
    }
    
    with open(f"{OUTPUT_DIR}/training_stats.json", "w") as f:
        json.dump(stats, f, indent=2)
    
    print(f"✅ Model saved to {OUTPUT_DIR}/final")
    print(f"✅ Stats saved to {OUTPUT_DIR}/training_stats.json")
    
    return trainer

def test_inference(model, tokenizer):
    """Test the fine-tuned model with sample prompts"""
    print("\n🧪 Testing inference...")
    
    test_prompts = [
        "Explain this Zig code:\nfn factorial(n: u32) u32 { if (n <= 1) return 1; return n * factorial(n - 1); }",
        "Write a Zig function to calculate Fibonacci numbers using comptime",
        "Fix this Zig error: expected type 'i32', found '[]const u8'",
    ]
    
    for i, prompt in enumerate(test_prompts, 1):
        print(f"\n--- Test {i} ---")
        print(f"Prompt: {prompt}")
        
        inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
        
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=256,
                temperature=0.7,
                top_p=0.9,
                do_sample=True,
            )
        
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        print(f"Response: {response[len(prompt):]}")  # Remove prompt from output

def main():
    """Main training pipeline"""
    print("=" * 80)
    print("ZigNet Fine-Tuning - QLoRA (Standard, NO Unsloth)")
    print("=" * 80)
    print(f"Model: {MODEL_NAME}")
    print(f"Device: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'}")
    print(f"CUDA: {torch.version.cuda}")
    print(f"PyTorch: {torch.__version__}")
    print("=" * 80)
    print()
    
    # Check CUDA
    if not torch.cuda.is_available():
        raise RuntimeError("CUDA not available! This script requires GPU.")
    
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Pipeline
    dataset = load_training_data()
    model, tokenizer = setup_model()
    trainer = train_model(model, tokenizer, dataset)
    test_inference(model, tokenizer)
    
    print("\n" + "=" * 80)
    print("✅ ALL DONE! Model ready for deployment.")
    print(f"📦 Next steps:")
    print(f"   1. Test model: python -c 'from transformers import AutoModel; ...'")
    print(f"   2. Convert to GGUF: python convert.py {OUTPUT_DIR}/final")
    print(f"   3. Quantize: ./quantize zignet-qwen-7b.gguf zignet-qwen-7b-Q4_K_M.gguf Q4_K_M")
    print(f"   4. Upload to HuggingFace: huggingface-cli upload {HF_REPO_NAME}")
    print("=" * 80)

if __name__ == "__main__":
    main()
