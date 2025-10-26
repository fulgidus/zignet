#!/bin/bash

# Script per testare tutti i modelli disponibili in Ollama

RESULTS_DIR="test-results"
mkdir -p $RESULTS_DIR

echo "═══════════════════════════════════════════════════════════════"
echo "🚀 SEQUENTIAL MODEL TESTING SUITE"
echo "📅 $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Rileva tutti i modelli disponibili in Ollama
echo "🔍 Detecting available models in Ollama..."
MODELS_RAW=$(ollama list | tail -n +2 | awk '{print $1}' | grep -v "^$")

if [ -z "$MODELS_RAW" ]; then
  echo "❌ No models found in Ollama. Please pull some models first:"
  echo "   ollama pull phi:2.7b"  
  echo "   ollama pull mistral"
  echo "   ollama pull codeqwen:latest"
  exit 1
fi

# Converti in array
declare -a MODELS
while IFS= read -r line; do
    MODELS+=("$line")
done <<< "$MODELS_RAW"

echo "📋 Found ${#MODELS[@]} models:"
for model in "${MODELS[@]}"; do
  echo "   • $model"
done
echo ""

# Array per tracciare risultati
declare -a TEST_RESULTS

for i in "${!MODELS[@]}"; do
  MODEL="${MODELS[$i]}"
  TEST_NUM=$((i + 1))
  TOTAL=${#MODELS[@]}
  
  echo ""
  echo "┌─────────────────────────────────────────────────────────────┐"
  echo "│ TEST $TEST_NUM/$TOTAL: $MODEL"
  echo "└─────────────────────────────────────────────────────────────┘"
  echo ""
  
  # Il modello è già disponibile (rilevato da ollama list)
  
  # Esegui test avanzato
  echo ""
  echo "🧪 Running advanced tests..."
  node test-model-advanced.js "$MODEL"
  
  if [ $? -eq 0 ]; then
    echo "✅ Tests completed for $MODEL"
    TEST_RESULTS+=("✅ $MODEL")
  else
    echo "❌ Tests failed for $MODEL"
    TEST_RESULTS+=("❌ $MODEL - TEST FAILED")
  fi
  
  echo ""
  echo "⏱️  Waiting 30 seconds before next test..."
  sleep 30
done

# Stampa summary
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "📊 FINAL SUMMARY"
echo "═══════════════════════════════════════════════════════════════"
echo ""

for result in "${TEST_RESULTS[@]}"; do
  echo "$result"
done

echo ""
echo "📁 Results saved to:"
ls -1 advanced-test-*.md advanced-test-*.json 2>/dev/null | sed 's/^/   /'
echo ""
echo "✅ All tests completed!"
echo "═══════════════════════════════════════════════════════════════"