#!/usr/bin/env python3
"""
ZigNet Fine-Tuning Script - QLoRA with Unsloth
Optimized for RTX 3090 (24GB VRAM)

Usage:
    python scripts/train-qwen-unsloth.py
    
Environment:
    - CUDA 12.7
    - PyTorch 2.4+
    - Unsloth (2x faster than standard training)
"""

import os
import json
import torch
from datetime import datetime
from datasets import load_dataset
from transformers import TrainingArguments
from trl import SFTTrainer
from unsloth import FastLanguageModel

# ============================================================================
# CONFIGURATION
# ============================================================================

# Model settings
MODEL_NAME = "unsloth/Qwen2.5-Coder-7B-Instruct-bnb-4bit"  # Pre-quantized 4-bit
MAX_SEQ_LENGTH = 2048  # Zig code can be long
DTYPE = None  # Auto-detect (float16 for RTX 3090)
LOAD_IN_4BIT = True  # QLoRA requires 4-bit

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
EVAL_STEPS = 500
LOGGING_STEPS = 10

# Dataset paths
TRAIN_DATA = "data/training/dataset-train.jsonl"
VAL_DATA = "data/training/dataset-validation.jsonl"

# Unsloth optimizations
USE_GRADIENT_CHECKPOINTING = True  # Save VRAM at cost of speed
USE_FLASH_ATTENTION = True  # 2x faster attention (RTX 30xx supports it)

# HuggingFace Hub (optional)
HF_USERNAME = "fulgidus"
HF_MODEL_NAME = "zignet-qwen2.5-coder-7b"
PUSH_TO_HUB = False  # Set True when ready to upload


# ============================================================================
# DATASET PREPARATION
# ============================================================================

def format_prompt_alpaca(sample):
    """
    Format dataset entry into Alpaca-style prompt.
    
    Format:
        ### Instruction:
        {instruction}
        
        ### Input:
        {input}
        
        ### Response:
        {output}
    """
    instruction = sample["instruction"]
    input_text = sample.get("input", "")
    output = sample["output"]
    
    if input_text:
        prompt = f"""### Instruction:
{instruction}

### Input:
{input_text}

### Response:
{output}"""
    else:
        prompt = f"""### Instruction:
{instruction}

### Response:
{output}"""
    
    return {"text": prompt}


def load_training_data():
    """Load and prepare training datasets."""
    print("\n📚 Loading datasets...")
    
    # Load train and validation datasets
    train_dataset = load_dataset("json", data_files=TRAIN_DATA, split="train")
    val_dataset = load_dataset("json", data_files=VAL_DATA, split="train")
    
    print(f"  ✅ Train examples: {len(train_dataset)}")
    print(f"  ✅ Validation examples: {len(val_dataset)}")
    
    # Format prompts
    train_dataset = train_dataset.map(format_prompt_alpaca, remove_columns=train_dataset.column_names)
    val_dataset = val_dataset.map(format_prompt_alpaca, remove_columns=val_dataset.column_names)
    
    return train_dataset, val_dataset


# ============================================================================
# MODEL SETUP
# ============================================================================

def setup_model():
    """Initialize model with Unsloth optimizations."""
    print("\n🚀 Loading model with Unsloth...")
    print(f"  Model: {MODEL_NAME}")
    print(f"  Max sequence length: {MAX_SEQ_LENGTH}")
    print(f"  4-bit quantization: {LOAD_IN_4BIT}")
    
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=MODEL_NAME,
        max_seq_length=MAX_SEQ_LENGTH,
        dtype=DTYPE,
        load_in_4bit=LOAD_IN_4BIT,
    )
    
    # Setup LoRA
    print("\n🔧 Configuring LoRA...")
    print(f"  Rank: {LORA_R}")
    print(f"  Alpha: {LORA_ALPHA}")
    print(f"  Dropout: {LORA_DROPOUT}")
    
    model = FastLanguageModel.get_peft_model(
        model,
        r=LORA_R,
        target_modules=LORA_TARGET_MODULES,
        lora_alpha=LORA_ALPHA,
        lora_dropout=LORA_DROPOUT,
        bias="none",
        use_gradient_checkpointing=USE_GRADIENT_CHECKPOINTING,
        random_state=42,
        use_rslora=False,  # Rank-stabilized LoRA (optional)
        loftq_config=None,
    )
    
    # Print trainable parameters
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total_params = sum(p.numel() for p in model.parameters())
    print(f"\n📊 Model parameters:")
    print(f"  Trainable: {trainable_params:,} ({100 * trainable_params / total_params:.2f}%)")
    print(f"  Total: {total_params:,}")
    
    return model, tokenizer


# ============================================================================
# TRAINING
# ============================================================================

def train_model(model, tokenizer, train_dataset, val_dataset):
    """Execute fine-tuning with SFTTrainer."""
    print("\n🏋️ Starting training...")
    
    # Training arguments
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        num_train_epochs=NUM_EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        per_device_eval_batch_size=BATCH_SIZE,
        gradient_accumulation_steps=GRADIENT_ACCUMULATION_STEPS,
        learning_rate=LEARNING_RATE,
        weight_decay=WEIGHT_DECAY,
        warmup_steps=WARMUP_STEPS,
        lr_scheduler_type=LR_SCHEDULER_TYPE,
        logging_steps=LOGGING_STEPS,
        save_strategy=SAVE_STRATEGY,
        save_steps=SAVE_STEPS,
        eval_strategy="steps",
        eval_steps=EVAL_STEPS,
        save_total_limit=3,  # Keep only 3 best checkpoints
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
        greater_is_better=False,
        fp16=not torch.cuda.is_bf16_supported(),  # Use fp16 for RTX 3090
        bf16=torch.cuda.is_bf16_supported(),
        optim="adamw_8bit",  # 8-bit optimizer saves VRAM
        gradient_checkpointing=USE_GRADIENT_CHECKPOINTING,
        group_by_length=True,  # Group similar lengths for efficiency
        report_to="none",  # Disable wandb/tensorboard for now
        seed=42,
    )
    
    # Trainer
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        dataset_text_field="text",
        max_seq_length=MAX_SEQ_LENGTH,
        args=training_args,
        packing=False,  # Don't pack multiple samples (better for code)
    )
    
    # Print training info
    effective_batch_size = BATCH_SIZE * GRADIENT_ACCUMULATION_STEPS
    total_steps = (len(train_dataset) // effective_batch_size) * NUM_EPOCHS
    print(f"\n📈 Training configuration:")
    print(f"  Epochs: {NUM_EPOCHS}")
    print(f"  Batch size (per GPU): {BATCH_SIZE}")
    print(f"  Gradient accumulation: {GRADIENT_ACCUMULATION_STEPS}")
    print(f"  Effective batch size: {effective_batch_size}")
    print(f"  Total steps: {total_steps}")
    print(f"  Learning rate: {LEARNING_RATE}")
    print(f"  Warmup steps: {WARMUP_STEPS}")
    print(f"  Eval every: {EVAL_STEPS} steps")
    print(f"  Save every: {SAVE_STEPS} steps")
    
    # Check VRAM
    if torch.cuda.is_available():
        gpu_stats = torch.cuda.get_device_properties(0)
        max_memory = gpu_stats.total_memory / 1024**3
        print(f"\n💾 GPU Memory:")
        print(f"  Total: {max_memory:.2f} GB")
        print(f"  Allocated: {torch.cuda.memory_allocated(0) / 1024**3:.2f} GB")
        print(f"  Reserved: {torch.cuda.memory_reserved(0) / 1024**3:.2f} GB")
    
    # Train!
    print("\n🔥 Training started...")
    print("=" * 80)
    
    start_time = datetime.now()
    trainer.train()
    end_time = datetime.now()
    
    print("=" * 80)
    print(f"\n✅ Training complete!")
    print(f"  Duration: {end_time - start_time}")
    
    return trainer


# ============================================================================
# SAVE & EXPORT
# ============================================================================

def save_model(model, tokenizer, trainer):
    """Save LoRA adapters and merged model."""
    print("\n💾 Saving model...")
    
    # Save LoRA adapters
    lora_dir = f"{OUTPUT_DIR}/lora_adapters"
    model.save_pretrained(lora_dir)
    tokenizer.save_pretrained(lora_dir)
    print(f"  ✅ LoRA adapters saved to: {lora_dir}")
    
    # Save merged model (base + LoRA)
    print("\n🔀 Merging LoRA adapters with base model...")
    merged_dir = f"{OUTPUT_DIR}/merged"
    model.save_pretrained_merged(merged_dir, tokenizer, save_method="merged_16bit")
    print(f"  ✅ Merged model saved to: {merged_dir}")
    
    # Save training stats
    stats = {
        "model_name": MODEL_NAME,
        "training_date": datetime.now().isoformat(),
        "num_epochs": NUM_EPOCHS,
        "train_samples": len(trainer.train_dataset),
        "eval_samples": len(trainer.eval_dataset),
        "final_train_loss": trainer.state.log_history[-2]["loss"] if len(trainer.state.log_history) > 1 else None,
        "final_eval_loss": trainer.state.log_history[-1].get("eval_loss"),
        "best_eval_loss": trainer.state.best_metric,
        "total_steps": trainer.state.global_step,
        "lora_config": {
            "r": LORA_R,
            "alpha": LORA_ALPHA,
            "dropout": LORA_DROPOUT,
        },
    }
    
    stats_file = f"{OUTPUT_DIR}/training_stats.json"
    with open(stats_file, "w") as f:
        json.dump(stats, f, indent=2)
    print(f"  ✅ Training stats saved to: {stats_file}")
    
    # Optionally push to HuggingFace Hub
    if PUSH_TO_HUB:
        print(f"\n📤 Pushing to HuggingFace Hub: {HF_USERNAME}/{HF_MODEL_NAME}")
        model.push_to_hub_merged(
            f"{HF_USERNAME}/{HF_MODEL_NAME}",
            tokenizer,
            save_method="merged_16bit",
            token=os.getenv("HF_TOKEN"),
        )
        print("  ✅ Model uploaded!")


# ============================================================================
# INFERENCE TEST
# ============================================================================

def test_inference(model, tokenizer):
    """Test the fine-tuned model with sample prompts."""
    print("\n🧪 Testing inference...")
    
    # Enable inference mode
    FastLanguageModel.for_inference(model)
    
    test_prompts = [
        {
            "instruction": "Write a Zig function to add two integers",
            "input": "",
        },
        {
            "instruction": "Create a generic ArrayList in Zig",
            "input": "Use comptime for type parameter",
        },
        {
            "instruction": "Implement error handling for file operations",
            "input": "",
        },
    ]
    
    print("\n" + "=" * 80)
    for i, prompt_data in enumerate(test_prompts, 1):
        prompt = format_prompt_alpaca({"instruction": prompt_data["instruction"], 
                                        "input": prompt_data["input"], 
                                        "output": ""})["text"]
        
        # Remove the "### Response:" part for generation
        prompt = prompt.rsplit("### Response:", 1)[0] + "### Response:\n"
        
        print(f"\n[TEST {i}] Prompt:")
        print(prompt)
        print("\n[RESPONSE]:")
        
        inputs = tokenizer(prompt, return_tensors="pt").to("cuda")
        outputs = model.generate(
            **inputs,
            max_new_tokens=256,
            temperature=0.7,
            top_p=0.9,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id,
        )
        
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        # Extract only the generated part
        response = response.split("### Response:")[-1].strip()
        print(response)
        print("\n" + "-" * 80)
    
    print("=" * 80)


# ============================================================================
# MAIN
# ============================================================================

def main():
    """Main training pipeline."""
    print("=" * 80)
    print("🚀 ZigNet Fine-Tuning with Unsloth")
    print("=" * 80)
    print(f"\n📅 Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Check CUDA
    if not torch.cuda.is_available():
        raise RuntimeError("CUDA not available! Fine-tuning requires GPU.")
    
    print(f"\n✅ CUDA available: {torch.cuda.get_device_name(0)}")
    print(f"  CUDA version: {torch.version.cuda}")
    print(f"  PyTorch version: {torch.__version__}")
    
    # Load datasets
    train_dataset, val_dataset = load_training_data()
    
    # Setup model
    model, tokenizer = setup_model()
    
    # Train
    trainer = train_model(model, tokenizer, train_dataset, val_dataset)
    
    # Save
    save_model(model, tokenizer, trainer)
    
    # Test
    test_inference(model, tokenizer)
    
    print(f"\n📅 Finished: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("\n" + "=" * 80)
    print("🎉 Fine-tuning complete!")
    print("=" * 80)
    print("\n📦 Next steps:")
    print(f"  1. Review training stats: {OUTPUT_DIR}/training_stats.json")
    print(f"  2. Test merged model: {OUTPUT_DIR}/merged")
    print(f"  3. Convert to GGUF: python scripts/convert-to-gguf.py")
    print(f"  4. Upload to HuggingFace: Set PUSH_TO_HUB=True and HF_TOKEN")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    main()
