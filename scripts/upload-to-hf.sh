#!/bin/bash
# Upload ZigNet model and dataset to HuggingFace

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== ZigNet HuggingFace Upload ===${NC}\n"

# Activate virtual environment
source venv-train/bin/activate

# Check if already logged in
if ! huggingface-cli whoami &>/dev/null; then
    echo -e "${YELLOW}Non sei autenticato su HuggingFace.${NC}"
    echo -e "Vai su: ${BLUE}https://huggingface.co/settings/tokens${NC}"
    echo -e "Crea un token con permessi di ${YELLOW}write${NC}\n"
    huggingface-cli login
else
    echo -e "${GREEN}✓ Già autenticato su HuggingFace${NC}"
    huggingface-cli whoami
    echo ""
fi

# Upload model
echo -e "${BLUE}1. Upload del modello fine-tuned${NC}"
echo -e "   Repository: ${YELLOW}fulgidus/zignet-qwen2.5-coder-7b${NC}"
read -p "   Confermi upload del modello? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    hf upload fulgidus/zignet-qwen2.5-coder-7b \
        models/zignet-qwen-7b/final \
        --repo-type model \
        --commit-message "Initial upload: QLoRA fine-tuned Qwen2.5-Coder-7B for Zig code analysis"
    echo -e "${GREEN}✓ Modello uploadato${NC}\n"
else
    echo -e "${YELLOW}⊘ Upload modello saltato${NC}\n"
fi

# Upload dataset
echo -e "${BLUE}2. Upload del dataset${NC}"
echo -e "   Repository: ${YELLOW}fulgidus/zignet-training-dataset${NC}"
read -p "   Confermi upload del dataset? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    hf upload fulgidus/zignet-training-dataset \
        data/training \
        --repo-type dataset \
        --commit-message "ZigNet training dataset: 13,756 Zig code examples (0.13-0.15)"
    echo -e "${GREEN}✓ Dataset uploadato${NC}\n"
else
    echo -e "${YELLOW}⊘ Upload dataset saltato${NC}\n"
fi

echo -e "${GREEN}=== Upload completato ===${NC}"
echo -e "Modello: ${BLUE}https://huggingface.co/fulgidus/zignet-qwen2.5-coder-7b${NC}"
echo -e "Dataset: ${BLUE}https://huggingface.co/datasets/fulgidus/zignet-training-dataset${NC}"
