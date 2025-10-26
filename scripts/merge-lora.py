#!/usr/bin/env python3
"""
Convert ZigNet LoRA model to GGUF format for Ollama
Merges LoRA adapters with base model and quantizes to Q4_K_M
"""

import os
import sys
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

def merge_and_save():
    """Merge LoRA adapters with base model"""
    
    print("🔄 Loading base model: Qwen/Qwen2.5-Coder-7B-Instruct")
    base_model = AutoModelForCausalLM.from_pretrained(
        "Qwen/Qwen2.5-Coder-7B-Instruct",
        torch_dtype=torch.float16,
        device_map="auto",
        trust_remote_code=True
    )
    
    print("🔄 Loading LoRA adapters from models/zignet-qwen-7b/final")
    model = PeftModel.from_pretrained(
        base_model,
        "models/zignet-qwen-7b/final"
    )
    
    print("🔄 Merging LoRA with base model...")
    merged_model = model.merge_and_unload()
    
    print("🔄 Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(
        "Qwen/Qwen2.5-Coder-7B-Instruct",
        trust_remote_code=True
    )
    
    output_dir = "models/zignet-qwen-7b/merged"
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"💾 Saving merged model to {output_dir}")
    merged_model.save_pretrained(output_dir, safe_serialization=True)
    tokenizer.save_pretrained(output_dir)
    
    print("✅ Merge complete!")
    print(f"   Model saved to: {output_dir}")
    print("\n⚠️  Next step: Convert to GGUF with llama.cpp")
    print("   Run: pnpm run convert-to-gguf")

if __name__ == "__main__":
    merge_and_save()
