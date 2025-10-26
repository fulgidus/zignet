#!/bin/bash

# Crea la rete se non esiste
docker network create zignet-net 2>/dev/null || true

# Ferma e rimuovi container esistente se presente
docker stop ollama 2>/dev/null || true
docker rm ollama 2>/dev/null || true

# Avvia Ollama in Docker
mkdir -p ~/ollama-models
docker run -d \
  --name ollama \
  --network zignet-net \
  -p 11434:11434 \
  -v ~/ollama-models:/root/.ollama/models \
  ollama/ollama:latest

echo "✅ Ollama container avviato!"
echo ""
echo "Ora puoi usare ollama normalmente:"
echo "  ollama pull mistral"
echo "  ollama list"
echo "  ollama run mistral"
echo ""
echo "Il client ollama parlerà con il server Docker su localhost:11434"