#!/bin/bash

# Crea la rete se non esiste
docker network create zignet-net 2>/dev/null || true

# Verifica se il container esiste già
if docker ps -a --format '{{.Names}}' | grep -q '^ollama$'; then
    echo "📦 Container 'ollama' esiste già"
    
    # Verifica se è in esecuzione
    if docker ps --format '{{.Names}}' | grep -q '^ollama$'; then
        echo "✅ Ollama è già in esecuzione!"
        echo ""
        docker ps --filter "name=ollama" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    else
        echo "🔄 Avvio container esistente..."
        docker start ollama
        echo "✅ Ollama riavviato!"
    fi
else
    echo "🚀 Creazione nuovo container Ollama con GPU NVIDIA..."
    docker run -d \
      --gpus=all \
      --name ollama \
      --network zignet-net \
      -p 11434:11434 \
      -v ollama:/root/.ollama \
      ollama/ollama:latest
    
    echo "✅ Ollama container creato con supporto GPU!"
fi

echo ""
echo "📍 Modelli salvati nel volume Docker: ollama"
echo "🌐 Server: http://localhost:11434"
echo "🎮 GPU: NVIDIA (--gpus=all)"
echo ""
echo "Comandi disponibili:"
echo "  ollama pull <model>   # Scarica un modello"
echo "  ollama list           # Lista modelli installati"
echo "  ollama run <model>    # Esegui un modello"
echo ""
echo "💡 Verifica GPU attiva:"
echo "  docker exec ollama nvidia-smi"
echo ""
echo "🚀 I modelli sono persistenti - non verranno persi al riavvio!"