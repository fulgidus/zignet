# Changelog

All notable changes to ZigNet will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) aligned with Zig releases.

## [0.15.2-b] - 2025-10-26

### 🐛 Bug Fixes
- **Fixed** import error made impossible to start MCP server. Turns out thet a bini/cli.ts is needed, so I re-added it.

## [0.15.2-a] - 2025-10-26

### 🐛 Bug Fixes
- **Fixed** import error made impossible to start MCP server.

## [0.15.2] - 2025-10-26

### 🎉 Initial Release

First production-ready release of ZigNet, aligned with Zig 0.15.2.

### ✨ Features

#### MCP Server Integration
- **Complete MCP Protocol Implementation** - Full JSON-RPC support via `@modelcontextprotocol/sdk`
- **4 Production-Ready Tools**:
  - `analyze_zig` - Syntax and type validation using official Zig compiler (`zig ast-check`)
  - `compile_zig` - Code formatting with `zig fmt` (official formatter)
  - `get_zig_docs` - AI-powered documentation lookup with fine-tuned LLM
  - `suggest_fix` - Intelligent error fix suggestions with context-aware AI

#### Zig Compiler Integration
- **Multi-version Support** - Zig 0.13.0, 0.14.1, 0.15.2 with automatic version detection
- **Smart Zig Manager** - Auto-downloads and caches Zig binaries on-demand
- **System Integration** - Detects and uses existing Zig installations when available
- **Cross-platform** - Linux (x64, arm64), macOS (x64, arm64), Windows (x64, arm64)

#### AI-Powered Features
- **Fine-tuned LLM** - Custom Qwen2.5-Coder-7B model trained on 13,756 Zig examples
- **GGUF Quantization** - Q4_K_M format (4.4GB) for efficient local inference
- **GPU Acceleration** - CUDA support with configurable GPU layer offloading
- **Auto-download** - Model automatically downloaded from HuggingFace on first use
- **Offline Capable** - All features work without internet after initial setup

#### Core Components
- **Lexer** - Complete tokenization with 100% test coverage
- **Parser** - Full AST generation for Zig syntax
- **Type Checker** - Semantic analysis and type validation
- **Code Generator** - Clean code emission with formatting

### 🧪 Testing

- **27 E2E Tests** - Comprehensive end-to-end test suite (100% pass rate)
  - 12 deterministic tests (always run, no LLM required)
  - 15 LLM-powered tests (graceful skip if model unavailable)
- **Test Categories**:
  - Tool validation (analyze, compile, docs, suggest)
  - Integration workflows (analyze → suggest → fix)
  - Performance tests (concurrency, resource management)
  - Edge cases (empty code, large files, invalid input)
- **CI/CD Ready** - Tests run on GitHub Actions without GPU requirements
- **Execution Time** - 8.7s (deterministic only), 60-120s (with LLM)

### 📚 Documentation

- **Comprehensive Guides**:
  - `README.md` - Quick start, features, usage examples
  - `AGENTS.md` - Detailed project specification and architecture
  - `docs/DEVELOPMENT.md` - Developer guide with E2E testing documentation
  - `docs/TESTING.md` - Testing strategies and best practices
  - `docs/TRAINING_GUIDE.md` - LLM fine-tuning process
  - `tests/e2e/README.md` - E2E test suite documentation

### 🔧 Configuration

- **Environment Variables**:
  - `ZIGNET_MODEL_PATH` - Custom model path (default: `~/.zignet/models/zignet-qwen-7b-q4km.gguf`)
  - `ZIGNET_MODEL_AUTO_DOWNLOAD` - Auto-download model if missing (default: `false`)
  - `ZIGNET_GPU_LAYERS` - GPU offload layers, 0 for CPU-only (default: `35`)
  - `ZIG_SUPPORTED` - Comma-separated supported versions (default: `0.13.0,0.14.1,0.15.2`)
  - `ZIG_DEFAULT` - Default Zig version (default: `0.15.2`)

### 📦 Distribution

- **npm Package** - `npm install -g zignet` or `npx -y zignet`
- **HuggingFace Model** - [`fulgidus/zignet-qwen2.5-coder-7b`](https://huggingface.co/fulgidus/zignet-qwen2.5-coder-7b)
  - Base model: Qwen2.5-Coder-7B-Instruct
  - Fine-tuning: QLoRA (4-bit) on RTX 3090
  - Dataset: 13,756 examples (9,629 train, 2,063 val, 2,064 test)
  - GGUF: Q4_K_M quantization (4.4GB)
- **GitHub Repository** - [`fulgidus/zignet`](https://github.com/fulgidus/zignet)

### 🎯 Performance

- **Analysis Speed** - < 100ms for syntax validation (deterministic)
- **Format Speed** - < 200ms for code formatting
- **LLM Inference** - 8-15s per query (GPU-accelerated)
- **Model Loading** - ~5-10s on first query (cached afterwards)
- **Memory Usage** - ~6GB VRAM (GPU) or ~8GB RAM (CPU-only)

### 🔍 Benchmarks

Tested against 14 different LLM models, **Qwen2.5-Coder-7B selected** for:
- ⭐⭐⭐⭐⭐ Best Zig syntax understanding
- ⭐⭐⭐⭐⭐ Modern idioms (comptime, generics, error handling)
- 100% pass rate on validation benchmarks
- 29.58s average response time (pre-quantization)

### 🛠️ Development

- **Build System** - tsdown (Rolldown-based) for fast CJS + ESM compilation
- **TypeScript** - Full type safety with strict mode
- **Testing** - Jest with ts-jest transformer
- **Linting** - ESLint + TypeScript rules
- **Formatting** - Prettier integration

### 📋 Supported Platforms

- **Operating Systems**: Linux, macOS, Windows
- **Architectures**: x64, arm64
- **Node.js**: >= 18.0.0
- **Zig Versions**: 0.13.0, 0.14.1, 0.15.2

### 🎨 MCP Client Support

- **Claude Desktop** - Full support (macOS, Windows, Linux)
- **VS Code + GitHub Copilot** - Full support
- **Any MCP-compatible client** - Standard MCP protocol implementation

### 📝 License

WTFPL v2 - Do What The Fuck You Want To Public License

### 🙏 Credits

- **Base Model**: [Qwen/Qwen2.5-Coder-7B-Instruct](https://huggingface.co/Qwen/Qwen2.5-Coder-7B-Instruct)
- **Dataset Sources**:
  - Official Zig documentation (0.13.0, 0.14.1, 0.15.2)
  - 97% real-world Zig repositories
  - Community contributions

---

## Version Naming Convention

ZigNet versions follow the **latest supported Zig version** for clarity:
- `0.15.2` = Supports Zig 0.13.0, 0.14.1, **0.15.2**
- `0.16.x` = Will support Zig 0.14.x, 0.15.x, **0.16.x** (when released)

Patch versions (e.g., `0.15.2-a`) indicate ZigNet updates without Zig version changes.

---

## Future Roadmap

### Planned Features
- [ ] Support for Zig 0.16.0+ (when released)
- [ ] Incremental LLM re-training pipeline
- [ ] LSP (Language Server Protocol) integration
- [ ] Web-based playground
- [ ] Plugin system for custom analyzers
- [ ] Real-time collaboration features

### Community Contributions Welcome
- Bug reports and feature requests: [GitHub Issues](https://github.com/fulgidus/zignet/issues)
- Pull requests: [Contributing Guide](https://github.com/fulgidus/zignet/blob/main/docs/DEVELOPMENT.md)
- Discussions: [GitHub Discussions](https://github.com/fulgidus/zignet/discussions)

---

[0.15.2]: https://github.com/fulgidus/zignet/releases/tag/v0.15.2
