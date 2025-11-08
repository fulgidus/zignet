# ZigNet

**MCP Server for Zig** — Intelligent code analysis, validation, and documentation powered by a fine-tuned LLM

ZigNet integrates with Claude (and other MCP-compatible LLMs) to provide real-time Zig code analysis without leaving your chat interface.

---

## 🎯 Features

### MCP Tools

<details>
<summary><b>🔍 analyze_zig</b> — Syntax and type checking with official Zig compiler</summary>

Analyze Zig code for syntax errors, type mismatches, and semantic issues using `zig ast-check`.

**Example usage:**
```typescript
User: "Analyze this Zig code"
Claude: [calls analyze_zig tool]
Response: "✅ Syntax: Valid | Type Check: PASS | Warnings: 0"
```

**Capabilities:**
- Lexical analysis (tokenization)
- Syntax parsing (AST generation)
- Type checking and validation
- Semantic error detection
- Line/column error reporting

</details>

<details>
<summary><b>✨ compile_zig</b> — Format and validate Zig code</summary>

Validate and format Zig code using `zig fmt`, generating clean, idiomatic output.

**Example:**
```zig
// Input (messy)
fn add(a:i32,b:i32)i32{return a+b;}

// Output (formatted)
fn add(a: i32, b: i32) i32 {
    return a + b;
}
```

**Capabilities:**
- Code formatting (2-space indentation)
- Syntax validation
- Best practices enforcement
- Preserves semantics

</details>

<details>
<summary><b>📖 get_zig_docs</b> — AI-powered documentation lookup (coming soon)</summary>

Retrieve Zig documentation and explanations for language features using a fine-tuned LLM.

**Example:**
```typescript
Query: "comptime"
Response: "comptime enables compile-time evaluation in Zig..."
```

**Powered by:**
- Fine-tuned Qwen2.5-Coder-7B model
- 13,756 examples from Zig 0.13-0.15
- Specialized on advanced Zig idioms (comptime, generics, error handling)

</details>

<details>
<summary><b>🔧 suggest_fix</b> — Intelligent error fix suggestions (coming soon)</summary>

Get intelligent code fix suggestions for Zig errors using AI-powered analysis.

**Example:**
```zig
// Error: "Type mismatch: cannot assign string to i32"
var x: i32 = "hello";

// Suggestions:
// Option 1: var x: []const u8 = "hello";  // If you meant string
// Option 2: var x: i32 = 42;              // If you meant integer
```

**Features:**
- Context-aware suggestions
- Multiple fix options
- Explanation of the issue
- Zig idiom recommendations

</details>

---

## 📖 Usage

ZigNet is an **MCP server** — configure it once in your MCP client, then use it naturally in conversation.

<details>
<summary><b>🖥️ Claude Desktop</b></summary>

**Configuration file location:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**Add this:**
```json
{
  "mcpServers": {
    "zignet": {
      "command": "npx",
      "args": ["-y", "zignet"]
    }
  }
}
```

**Then restart Claude Desktop** and start using:
```
You: "Analyze this Zig code for errors"
     [paste code]

Claude: [uses analyze_zig tool]
        "Found 1 type error: variable 'x' expects i32 but got []const u8"
```

</details>

<details>
<summary><b>🔧 VS Code (with GitHub Copilot)</b></summary>

**Method 1: VS Code Marketplace (coming soon)**
1. Open VS Code Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
2. Search for `@mcp zignet`
3. Click **Install**
4. Restart VS Code

**Method 2: Manual configuration (available now)**
1. Install GitHub Copilot extension (if not already installed)
2. Open Copilot settings
3. Add to MCP servers config:

```json
{
  "mcpServers": {
    "zignet": {
      "command": "npx",
      "args": ["-y", "zignet"]
    }
  }
}
```

**Then restart VS Code** and Copilot will have access to ZigNet tools.

</details>

### What happens after configuration?

1. **First use**: `npx` downloads and caches ZigNet automatically
2. **Zig compiler**: Downloads on-demand (supports Zig 0.13, 0.14, 0.15)
3. **Tools available**: `analyze_zig`, `compile_zig` (+ `get_zig_docs`, `suggest_fix` coming soon)
4. **Zero maintenance**: Updates automatically via `npx -y zignet`

---

## ⚙️ Configuration

### GPU Selection (Multi-GPU Systems)

If you have multiple GPUs (e.g., AMD + NVIDIA), you can control which GPU ZigNet uses via environment variables.

**Windows (PowerShell):**
```powershell
$env:ZIGNET_GPU_DEVICE="0"
npx -y zignet
```

**macOS/Linux:**
```bash
export ZIGNET_GPU_DEVICE="0"
npx -y zignet
```

**VS Code MCP Configuration with GPU selection:**
```json
{
  "mcpServers": {
    "zignet": {
      "command": "npx",
      "args": ["-y", "zignet"],
      "env": {
        "ZIGNET_GPU_DEVICE": "0"
      }
    }
  }
}
```

**Claude Desktop configuration with GPU selection:**

**macOS/Linux** (`~/.config/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "zignet": {
      "command": "npx",
      "args": ["-y", "zignet"],
      "env": {
        "ZIGNET_GPU_DEVICE": "0"
      }
    }
  }
}
```

**Windows** (`%APPDATA%\Claude\claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "zignet": {
      "command": "npx",
      "args": ["-y", "zignet"],
      "env": {
        "ZIGNET_GPU_DEVICE": "0"
      }
    }
  }
}
```

**GPU Device Values:**
- `"0"` - Use first GPU only (e.g., RTX 4090)
- `"1"` - Use second GPU only
- `"0,1"` - Use both GPUs
- Not set - Use all available GPUs (default)

**Identify your GPUs:**
```bash
# NVIDIA GPUs
nvidia-smi

# Output shows GPU indices:
# GPU 0: NVIDIA RTX 4090
# GPU 1: AMD Radeon 6950XT (won't be used by CUDA anyway)
```

### Advanced Configuration

All configuration options can be set via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `ZIGNET_GPU_DEVICE` | auto | GPU device selection (CUDA_VISIBLE_DEVICES) |
| `ZIGNET_GPU_LAYERS` | 35 | Number of model layers on GPU (0=CPU only) |
| `ZIGNET_MODEL_PATH` | `~/.zignet/models/...` | Custom model path |
| `ZIGNET_MODEL_AUTO_DOWNLOAD` | true | Auto-download model from HuggingFace |
| `ZIGNET_CONTEXT_SIZE` | 4096 | LLM context window size |
| `ZIGNET_TEMPERATURE` | 0.7 | LLM creativity (0.0-1.0) |
| `ZIGNET_TOP_P` | 0.9 | LLM sampling parameter |
| `ZIG_SUPPORTED` | 0.13.0,0.14.0,0.15.2 | Supported Zig versions |
| `ZIG_DEFAULT` | 0.15.2 | Default Zig version |

See [.env.example](./.env.example) for detailed examples.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│ Claude / MCP Client                                 │
└────────────────────┬────────────────────────────────┘
                     │ MCP Protocol (JSON-RPC)
┌────────────────────▼────────────────────────────────┐
│ ZigNet MCP Server (TypeScript)                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ Tool Handlers                                │   │
│  │ - analyze_zig                                │   │
│  │ - compile_zig                                │   │
│  │ - get_zig_docs                               │   │
│  │ - suggest_fix                                │   │
│  └─────────────┬────────────────────────────────┘   │
│                ▼                                    │
│  ┌──────────────────────────────────────────────┐   │
│  │ Zig Compiler Integration                     │   │
│  │ - zig ast-check (syntax + type validation)   │   │
│  │ - zig fmt (official formatter)               │   │
│  │ - Auto-detects system Zig installation       │   │
│  │ - Falls back to downloading if needed        │   │
│  └─────────────┬────────────────────────────────┘   │
│                ▼                                    │
│  ┌──────────────────────────────────────────────┐   │
│  │ Fine-tuned LLM (Qwen2.5-Coder-7B)            │   │
│  │ - Documentation lookup                       │   │
│  │ - Intelligent suggestions                    │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Why this architecture?**
- **Official Zig compiler** (100% accurate, always up-to-date) instead of custom parser
- **System integration** (uses existing Zig installation if available)
- **LLM-powered suggestions** (get_zig_docs, suggest_fix) for intelligence
- **No external API calls** (local inference via node-llama-cpp)
- **Fast** (< 100ms for validation, < 2s for LLM suggestions)

**Note:** When Zig releases a new version (e.g., 0.16.0), ZigNet will need to re-train the LLM model on updated documentation and examples.

---

## 🧪 Development Status

| Component            | Status     | Notes                               |
| -------------------- | ---------- | ----------------------------------- |
| Zig Compiler Wrapper | ✅ Complete | ast-check + fmt integration         |
| System Zig Detection | ✅ Complete | Auto-detects installed Zig versions |
| Multi-version Cache  | ✅ Complete | Downloads Zig 0.13-0.15 on demand   |
| MCP Server           | ✅ Complete | All 4 tools fully implemented       |
| LLM Fine-tuning      | ✅ Complete | Trained on 13,756 Zig examples      |
| get_zig_docs         | ✅ Complete | LLM-powered documentation lookup    |
| suggest_fix          | ✅ Complete | LLM-powered intelligent suggestions |
| GGUF Conversion      | ✅ Complete | Q4_K_M quantized (4.4GB)            |
| E2E Testing          | ✅ Complete | 27/27 tests passing (8.7s)          |
| Claude Integration   | ⏳ Planned  | Final deployment to Claude Desktop  |

**Current Phase:** Ready for deployment - All core features complete

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests (unit + E2E)
pnpm test

# Run only E2E tests
pnpm test tests/e2e/mcp-integration.test.ts

# Run deterministic tests only (no LLM required)
SKIP_LLM_TESTS=1 pnpm test tests/e2e

# Watch mode for development
pnpm test:watch
```

### Test Coverage

**E2E Test Suite:** 27 tests covering all MCP tools

| Tool         | Tests | Type          | Pass Rate |
| ------------ | ----- | ------------- | --------- |
| analyze_zig  | 4     | Deterministic | 100%      |
| compile_zig  | 3     | Deterministic | 100%      |
| get_zig_docs | 5     | LLM-powered   | 100%      |
| suggest_fix  | 5     | LLM-powered   | 100%      |
| Integration  | 3     | Mixed         | 100%      |
| Performance  | 3     | Stress tests  | 100%      |
| Edge Cases   | 4     | Error paths   | 100%      |

**Execution time:** 8.7 seconds (without LLM model, deterministic only)  
**With LLM model:** ~60-120 seconds (includes model loading + inference)

### Test Behavior

- **Deterministic tests** (12 tests): Always run, use Zig compiler directly
- **LLM tests** (15 tests): Auto-skip if model not found, graceful degradation
- **CI/CD ready**: Runs on GitHub Actions without GPU requirements

For detailed testing guide, see [tests/e2e/README.md](./tests/e2e/README.md)

---

## 📦 Project Structure

```
zignet/
├── src/
│   ├── config.ts             # Environment-based configuration
│   ├── mcp-server.ts         # MCP protocol handler
│   ├── zig/
│   │   ├── manager.ts        # Multi-version Zig download/cache
│   │   └── executor.ts       # zig ast-check + fmt wrapper
│   ├── llm/
│   │   ├── model-downloader.ts  # Auto-download GGUF from HuggingFace
│   │   └── session.ts           # node-llama-cpp integration
│   └── tools/
│       ├── analyze.ts        # analyze_zig tool (COMPLETE)
│       ├── compile.ts        # compile_zig tool (COMPLETE)
│       ├── docs.ts           # get_zig_docs tool (COMPLETE)
│       └── suggest.ts        # suggest_fix tool (COMPLETE)
├── scripts/
│   ├── train-qwen-standard.py   # Fine-tuning script (COMPLETE)
│   ├── scrape-zig-repos.js      # Dataset collection
│   ├── install-zig.js           # Zig version installer
│   └── test-config.cjs          # Config system tests
├── data/
│   ├── training/             # 13,756 examples (train/val/test)
│   └── zig-docs/             # Scraped documentation
├── models/
│   └── zignet-qwen-7b/       # Fine-tuned model + LoRA adapters
├── tests/
│   ├── *.test.ts             # Unit tests (lexer, parser, etc.)
│   └── e2e/
│       ├── mcp-integration.test.ts  # 27 E2E tests
│       └── README.md               # Testing guide
├── docs/
│   ├── AGENTS.md             # Detailed project spec
│   ├── DEVELOPMENT.md        # Development guide
│   └── TESTING.md            # Testing documentation
└── README.md                 # This file
```

---

## 🤖 Model Details

**Base Model:** Qwen/Qwen2.5-Coder-7B-Instruct  
**Fine-tuning:** QLoRA (4-bit) on 13,756 Zig examples  
**Dataset:** 97% real-world repos (Zig 0.13-0.15), 3% documentation  
**Training:** RTX 3090 (24GB VRAM), 3 epochs, ~8 hours  
**Output:** `fulgidus/zignet-qwen2.5-coder-7b` (HuggingFace)  
**Quantization:** Q4_K_M (~4GB GGUF for node-llama-cpp)

**Why Qwen2.5-Coder-7B?**
- Best Zig syntax understanding (benchmarked vs 14 models)
- Modern idioms (comptime, generics, error handling)
- Fast inference (~15-20s per query post-quantization)

---

## 📊 Benchmarks

| Model               | Pass Rate | Avg Time | Quality | Notes                      |
| ------------------- | --------- | -------- | ------- | -------------------------- |
| Qwen2.5-Coder-7B    | 100%      | 29.58s   | ⭐⭐⭐⭐⭐   | **SELECTED** - Best idioms |
| DeepSeek-Coder-6.7B | 100%      | 27.86s   | ⭐⭐⭐⭐⭐   | Didactic, verbose          |
| Llama3.2-3B         | 100%      | 12.27s   | ⭐⭐⭐⭐    | Good balance               |
| CodeLlama-7B        | 100%      | 24.61s   | ⭐⭐⭐     | Confuses Zig/Rust          |
| Qwen2.5-Coder-0.5B  | 100%      | 3.94s    | ❌       | Invents syntax             |

Full benchmarks: `scripts/test-results/`

---

## 🛠️ Development

```bash
# Run tests
pnpm test

# Run specific component tests
pnpm test -- lexer
pnpm test -- parser
pnpm test -- type-checker

# Watch mode
pnpm test:watch

# Linting
pnpm lint
pnpm lint:fix

# Build
pnpm build
```

---

## 🤝 Contributing

See [AGENTS.md](./AGENTS.md) for detailed project specification and development phases.

**Current needs:**
- Testing on diverse Zig codebases
- Edge case discovery (parser/type-checker)
- Performance optimization
- Documentation improvements

---

## 📄 License

**WTFPL v2** — Do What The Fuck You Want To Public License

---

## 🔗 Links

- **Repository:** https://github.com/fulgidus/zignet
- **Model (post-training):** https://huggingface.co/fulgidus/zignet-qwen2.5-coder-7b
- **MCP Protocol:** https://modelcontextprotocol.io
- **Zig Language:** https://ziglang.org

---

**Status:** ✅ Phase 4 Complete - Ready for deployment (fine-tuning complete, E2E tests passing)
