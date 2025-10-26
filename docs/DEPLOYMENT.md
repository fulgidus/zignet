# Deployment Guide - npm vs Docker

## 🎯 TL;DR

**ZigNet è un pacchetto npm puro e autosufficiente.**

- ✅ **npm install** → Funziona su Linux/macOS/Windows senza dipendenze di sistema
- ✅ **Scarica Zig automaticamente** quando necessario
- ⚙️ **Docker è OPZIONALE** (solo per deployment server/containerizzato)

---

## 📦 Deployment come Pacchetto npm (RACCOMANDATO)

### Come Funziona

ZigNet **non ha dipendenze di sistema**. Tutto quello che serve:

1. **Node.js 18+** (già installato dall'utente)
2. **Dipendenze npm** (installate automaticamente)
3. **Zig compiler** (scaricato automaticamente on-demand)

```bash
# Utente installa ZigNet
npm install -g zignet

# Primo utilizzo: Zig viene scaricato automaticamente
zignet analyze code.zig
# → Downloads Zig 0.15.0 to ~/.zignet/zig-versions/
# → Runs analysis
# → Success!

# Utilizzi successivi: Usa Zig in cache
zignet analyze code2.zig
# → Uses cached Zig (no download)
```

### Pubblicazione su npm

```bash
# 1. Build production
pnpm run build:prod

# 2. Test pacchetto localmente
npm pack
npm install -g zignet-0.1.0.tgz

# 3. Publish su npm
npm publish

# 4. Utenti installano
npm install -g zignet
# oppure
npx zignet analyze code.zig
```

### Cosa Include il Pacchetto npm

**File inclusi** (definiti in `package.json` → `files`):
```
zignet/
├── dist/              # Compiled TypeScript
│   ├── mcp-server.js  # MCP server entry
│   ├── compile-*.js   # Tools (analyze, compile)
│   └── *.d.ts         # Type definitions
├── bin/
│   └── cli.js         # CLI entry point
├── scripts/
│   └── install-zig.js # Zig installer
├── README.md
└── LICENSE
```

**NON include** (esclusi da npm):
- ❌ `node_modules/` (utente installa le sue)
- ❌ `models/` (LLM scaricato on-demand)
- ❌ `data/` (non serve a runtime)
- ❌ `tests/` (non serve a runtime)
- ❌ `src/` (solo dist compilato)

### Dimensione Pacchetto npm

- **Codice compilato**: ~500KB (dist/)
- **Dipendenze npm**: ~50MB (node_modules)
- **Zig**: 0 bytes (scaricato on-demand, ~50MB per versione)
- **LLM**: 0 bytes (scaricato on-demand, ~4GB)

**Totale iniziale**: ~50MB  
**Totale dopo primo uso**: ~4.1GB (50MB npm + 50MB Zig + 4GB LLM)

### Multipiattaforma Automatica

**npm rileva automaticamente la piattaforma**:

```javascript
// src/zig/manager.ts
function detectPlatform() {
  const platform = process.platform; // 'linux', 'darwin', 'win32'
  const arch = process.arch;         // 'x64', 'arm64'
  
  // Scarica Zig corretto per la piattaforma
  const url = `https://ziglang.org/download/${version}/zig-${platform}-${arch}-${version}.tar.xz`;
  // ...
}
```

**Risultato**:
- 👤 Utente su **macOS ARM64** → scarica `zig-macos-aarch64-0.15.0`
- 👤 Utente su **Linux x64** → scarica `zig-linux-x86_64-0.15.0`
- 👤 Utente su **Windows x64** → scarica `zig-windows-x86_64-0.15.0`

**Nessuna configurazione richiesta!**

---

## 🐳 Deployment Docker (OPZIONALE)

### Quando Usare Docker

Docker è utile **SOLO** per:

1. **Server deployment** (es. MCP server sempre attivo)
2. **Ambienti isolati** (es. CI/CD con dipendenze controllate)
3. **Kubernetes/cloud** (es. deploy su AWS ECS, GCP Cloud Run)

**NON serve per**:
- ❌ Desktop usage (npm è meglio)
- ❌ Claude Desktop integration (usa npm)
- ❌ Sviluppo locale (usa npm)

### Come Funziona Docker

```bash
# Build immagine
docker build -t zignet:latest .

# Run container
docker run -e ZIG_DEFAULT="0.15.0" zignet:latest

# Deploy su registry
docker push ghcr.io/fulgidus/zignet:latest
```

**Vantaggi Docker**:
- ✅ Ambiente riproducibile
- ✅ Include tutte le dipendenze
- ✅ Pronto per cloud deployment

**Svantaggi Docker**:
- ❌ Immagine più grande (~200MB vs ~50MB npm)
- ❌ Overhead runtime (container vs processo nativo)
- ❌ Setup più complesso per utenti desktop

---

## 🔄 Confronto: npm vs Docker

| Feature                   | npm Package         | Docker Image         |
| ------------------------- | ------------------- | -------------------- |
| **Install Size**          | ~50MB               | ~200MB               |
| **Startup Time**          | ~100ms              | ~2s (container boot) |
| **Multipiattaforma**      | ✅ Automatico        | ⚠️ Multi-arch build   |
| **Claude Desktop**        | ✅ Nativo            | ❌ Non supportato     |
| **Server Deployment**     | ✅ Possibile         | ✅ Ideale             |
| **Zig Auto-download**     | ✅ Sì                | ⚠️ Pre-installato     |
| **LLM Auto-download**     | ✅ Sì                | ⚠️ Pre-installato     |
| **Aggiornamenti**         | `npm update zignet` | Rebuild immagine     |
| **Dipendenze di sistema** | ❌ Nessuna           | ❌ Nessuna            |
| **User Experience**       | ⭐⭐⭐⭐⭐               | ⭐⭐⭐                  |

---

## 📋 Deployment Checklist

### Per npm (Desktop/Claude)

```bash
# 1. Build production
pnpm run build:prod

# 2. Test localmente
npm pack
npm install -g zignet-0.1.0.tgz
zignet --version

# 3. Test MCP con Claude Desktop
# Aggiungi a claude_desktop_config.json:
{
  "mcpServers": {
    "zignet": {
      "command": "npx",
      "args": ["zignet"]
    }
  }
}

# 4. Publish
npm publish

# 5. Verifica
npm info zignet
npm install -g zignet
```

### Per Docker (Server)

```bash
# 1. Build immagine
docker build -t zignet:latest .

# 2. Test localmente
docker run --rm zignet:latest

# 3. Tag per registry
docker tag zignet:latest ghcr.io/fulgidus/zignet:latest

# 4. Push
docker push ghcr.io/fulgidus/zignet:latest

# 5. Deploy (esempio Kubernetes)
kubectl apply -f k8s/deployment.yaml
```

---

## 🎯 Raccomandazioni

### Per Utenti Desktop/Claude
```bash
# USARE NPM
npm install -g zignet
```

**Perché**:
- ✅ Installazione più semplice
- ✅ Aggiornamenti automatici
- ✅ Integrazione nativa con Claude Desktop
- ✅ Performance migliori (no overhead container)

### Per Server/Cloud
```bash
# USARE DOCKER (opzionale)
docker pull ghcr.io/fulgidus/zignet:latest
```

**Perché**:
- ✅ Ambiente isolato
- ✅ Deployment consistente
- ✅ Scalabilità cloud-native
- ✅ Rolling updates facili

### Per Sviluppatori
```bash
# USARE LOCALE
git clone https://github.com/fulgidus/zignet
pnpm install
pnpm run build
```

**Perché**:
- ✅ Hot reload durante sviluppo
- ✅ Debug diretto
- ✅ Test immediati

---

## 📝 Note Finali

**ZigNet è progettato come pacchetto npm self-contained.**

- **Nessuna dipendenza di sistema richiesta** (oltre Node.js)
- **Scarica Zig automaticamente** quando serve
- **Funziona su Linux, macOS, Windows** out-of-the-box
- **Docker è solo un bonus** per deployment server

**Il 99% degli utenti userà npm, non Docker.** 🚀
