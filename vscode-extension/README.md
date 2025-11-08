# ZigNet - AI-Powered Zig Assistant for VS Code

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/fulgidus.zignet)](https://marketplace.visualstudio.com/items?itemName=fulgidus.zignet)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**ZigNet** is a VS Code extension that provides AI-powered code analysis, validation, and documentation for the Zig programming language through the Model Context Protocol (MCP).

## ✨ Features

- 🔍 **Real-time Code Analysis** - Syntax and type validation using official Zig compiler
- ✨ **Smart Formatting** - Code formatting with `zig fmt`
- 📚 **AI-Powered Documentation** - Intelligent documentation lookup with fine-tuned LLM
- 🔧 **Error Fix Suggestions** - Context-aware suggestions for fixing code errors
- 🎯 **Multi-Version Support** - Works with Zig 0.13.0, 0.14.0, and 0.15.2

## 🚀 Quick Start

1. Install the extension from VS Code Marketplace
2. Open a Zig file (`.zig`)
3. The MCP server will start automatically and download the AI model (~4.4GB) on first run
4. Use commands from the Command Palette (`Ctrl+Shift+P`):
   - `ZigNet: Analyze Current File`
   - `ZigNet: Format Current File`
   - `ZigNet: Get Documentation`

## 📋 Requirements

- **VS Code** 1.80.0 or higher
- **Node.js** 20.x or higher (for running the MCP server)
- **Zig** (optional - auto-downloaded if not found)

> **Note**: This extension provides native Zig language support. You don't need to install any other Zig extension (though they can coexist if desired).

## ⚙️ Configuration

Access settings via `File > Preferences > Settings` and search for "ZigNet":

- `zignet.enable` - Enable/disable ZigNet MCP server (default: `true`)
- `zignet.zigVersion` - Default Zig version for analysis (default: `0.15.2`)
- `zignet.autoDownloadModel` - Auto-download AI model on first run (default: `true`)
- `zignet.modelPath` - Custom path to LLM model (optional)

## 🎮 Commands

| Command                        | Description                 |
| ------------------------------ | --------------------------- |
| `ZigNet: Analyze Current File` | Analyze Zig code for errors |
| `ZigNet: Format Current File`  | Format code with zig fmt    |
| `ZigNet: Get Documentation`    | Search Zig documentation    |
| `ZigNet: Restart Server`       | Restart the MCP server      |

## 🤖 AI Model

ZigNet uses a fine-tuned **Qwen2.5-Coder-7B** model specialized for Zig:

- **Model**: [fulgidus/zignet-qwen2.5-coder-7b](https://huggingface.co/fulgidus/zignet-qwen2.5-coder-7b)
- **Size**: 4.4GB (Q4_K_M quantized GGUF)
- **Training**: 13,756 Zig code examples from official docs
- **Auto-download**: Downloads automatically on first startup

## 🔧 How It Works

ZigNet runs an MCP (Model Context Protocol) server that:

1. **Deterministic Tools** (no AI needed):
   - `analyze_zig` - Uses official Zig compiler for validation
   - `compile_zig` - Uses `zig fmt` for formatting

2. **AI-Powered Tools** (uses fine-tuned LLM):
   - `get_zig_docs` - Documentation retrieval
   - `suggest_fix` - Intelligent error fixes

## 📦 Architecture

```
VS Code Extension
    ↓
ZigNet MCP Server (Node.js)
    ↓
┌─────────────────┬──────────────────┐
│  Zig Compiler   │  Fine-tuned LLM  │
│  (ast-check)    │  (Qwen2.5-7B)    │
└─────────────────┴──────────────────┘
```

## 🐛 Troubleshooting

### Server won't start
Check the Output panel (`View > Output > ZigNet`) for error messages.

### Model download is slow
The model is 4.4GB. You can:
- Wait for the download (progress shown in Output panel)
- Manually download from [HuggingFace](https://huggingface.co/fulgidus/zignet-qwen2.5-coder-7b) and set `zignet.modelPath`

### Commands not working
Make sure:
1. You're editing a `.zig` file (check the language mode in the bottom-right corner of VSCode)
2. The extension is enabled (`zignet.enable: true`)
3. Check the Output panel for server status

### "Please open a Zig file first" error
If you see this error even with a `.zig` file open:
1. Check the language mode indicator in the bottom-right corner of VSCode
2. It should show "Zig" - if it shows "Plain Text" or something else, click it and select "Zig"
3. Try reloading VSCode (`Developer: Reload Window` from Command Palette)
4. If the issue persists after upgrading from an older version, reinstall the extension

## 📚 Documentation

- [ZigNet GitHub](https://github.com/fulgidus/zignet)
- [Development Guide](https://github.com/fulgidus/zignet/blob/main/docs/DEVELOPMENT.md)
- [MCP Protocol](https://modelcontextprotocol.io)

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](https://github.com/fulgidus/zignet/blob/main/CONTRIBUTING.md)

## 📄 License

MIT License - see [LICENSE](https://github.com/fulgidus/zignet/blob/main/LICENSE)

## 🙏 Acknowledgments

- Built with [Model Context Protocol](https://modelcontextprotocol.io)
- Powered by [Qwen2.5-Coder](https://huggingface.co/Qwen/Qwen2.5-Coder-7B)
- Zig language by [Zig Software Foundation](https://ziglang.org)

---

**Enjoy using ZigNet!** 🚀
