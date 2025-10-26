#!/bin/bash

echo "🔍 Verifica servizi in ascolto su WSL..."
echo ""

# Funzione per verificare una porta
check_port() {
    local port=$1
    local name=$2
    
    if netstat -tln | grep -q ":$port "; then
        echo "✅ $name (porta $port) - IN ASCOLTO"
    else
        echo "❌ $name (porta $port) - NON ATTIVO"
    fi
}

# Verifica porte
check_port 8000 "HTTP Server (test-results)"
check_port 11434 "Ollama API"
check_port 3000 "Open-WebUI"

echo ""
echo "WSL IP Address:"
hostname -I

echo ""
echo "📋 Per configurare port forwarding su Windows:"
echo "   1. Apri PowerShell come Amministratore su Windows"
echo "   2. Vai nella cartella del progetto"
echo "   3. Esegui: .\\scripts\\setup-wsl-port-forward.ps1"
echo ""
echo "Oppure manualmente:"
echo "   netsh interface portproxy add v4tov4 listenport=8000 listenaddress=0.0.0.0 connectport=8000 connectaddress=$(hostname -I | awk '{print $1}')"
