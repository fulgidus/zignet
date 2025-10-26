#!/bin/bash
# Stop Ollama container (preserva modelli e dati)

echo "🛑 Stopping Ollama container..."

if docker ps --format '{{.Names}}' | grep -q '^ollama$'; then
    docker stop ollama
    echo "✅ Ollama fermato (dati preservati)"
    echo ""
    echo "Per riavviarlo:"
    echo "  pnpm run ollama"
    echo "  oppure: docker start ollama"
else
    echo "⚠️  Ollama non è in esecuzione"
fi

echo ""
echo "📍 Modelli salvati in: ~/ollama-models"
echo ""
echo "💡 Per eliminare TUTTO (container + modelli):"
echo "   docker rm ollama && rm -rf ~/ollama-models"
