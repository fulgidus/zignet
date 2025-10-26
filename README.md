# zignet
MCP server for Zig — AI-powered code generation, debugging, and documentation

## Features

- **generate_zig_code**: Generate idiomatic Zig code from natural language descriptions
- **debug_zig_code**: Analyze and debug Zig code with AI assistance
- **explain_zig_docs**: Get explanations of Zig language features and standard library

## Installation

```bash
npm install
```

## Usage

Start the MCP server:

```bash
npm start
```

Or use the CLI directly:

```bash
./bin/cli.js
```

## Configuration

Environment variables:
- `ZIGNET_CACHE_DIR`: Model cache directory (default: `~/.cache/zignet`)
- `ZIGNET_MODEL_NAME`: Model filename (default: `tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf`)
- `ZIGNET_MODEL_REPO`: HuggingFace repository (default: `TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF`)
- `ZIGNET_MODEL_FILE`: Model file in repository (default: `tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf`)

## Structure

- `bin/cli.js`: Executable entrypoint, downloads model and starts MCP stdio server
- `src/server.js`: MCP server implementation with tool handlers
- `src/model.js`: Model loading and text generation using node-llama-cpp
- `src/tools.js`: Tool definitions for the 3 AI tools
- `src/download.js`: Model caching and download logic
- `scripts/download-model.js`: HuggingFace model download script

## License

WTFPL v2 — Do What The Fuck You Want To Public License
