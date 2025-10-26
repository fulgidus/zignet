#!/bin/bash

# Script per testare tutti i modelli in sequenza

MODELS=(
  "phi:2.7b"
  "mistral"
  "codeqwen:latest"
)

RESULTS_DIR="test-results"
mkdir -p $RESULTS_DIR

echo "═══════════════════════════════════════════════════════════════"
echo "🚀 SEQUENTIAL MODEL TESTING SUITE"
echo "📅 $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════════════════════════"
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
  
  # Controlla se il modello esiste in Ollama
  if ! ollama list | grep -q "^${MODEL}"; then
    echo "⚠️  Model not found, pulling: $MODEL"
    ollama pull "$MODEL"
    if [ $? -ne 0 ]; then
      echo "❌ Failed to pull $MODEL"
      TEST_RESULTS+=("❌ $MODEL - PULL FAILED")
      continue
    fi
  fi
  
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