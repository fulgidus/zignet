# ZigNet

**MCP Server for Zig** — Intelligent code analysis, validation, and documentation powered by a fine-tuned LLM

ZigNet integrates with Claude (and other MCP-compatible LLMs) to provide real-time Zig code analysis without leaving your chat interface.

---

## 🎯 Features

### MCP Tools

#### 1. **analyze_zig**
Analyze Zig code for syntax errors, type mismatches, and semantic issues.

```typescript
// Example usage in Claude
User: "Analyze this Zig code"
Claude: [calls analyze_zig tool]
Response: "✅ Syntax: Valid | Type Check: PASS | Warnings: 0"
```

**Capabilities:**
- Lexical analysis (tokenization)
- Syntax parsing (AST generation)
- Type checking and validation
- Semantic error detection

---

#### 2. **compile_zig**
Validate and format Zig code, generating clean, idiomatic output.

```typescript
// Example
Input: "fn add(a:i32,b:i32)i32{return a+b;}"
Output: 
fn add(a: i32, b: i32) i32 {
    return a + b;
}
```

**Capabilities:**
- Code formatting (2-space indentation)
- Syntax validation
- Best practices enforcement

---

#### 3. **get_zig_docs**
Retrieve Zig documentation and explanations for language features.

```typescript
// Example
Query: "comptime"
Response: "comptime enables compile-time evaluation in Zig..."
```

**Powered by:**
- Fine-tuned Qwen2.5-Coder-7B model
- 13,756 examples from Zig 0.13-0.15
- Specialized on advanced Zig idioms (comptime, generics, error handling)

---

#### 4. **suggest_fix**
Get intelligent code fix suggestions for Zig errors.

```typescript
// Example
Error: "Type mismatch: cannot assign string to i32"
Code: var x: i32 = "hello";

Suggestion:
Option 1: var x: []const u8 = "hello";  // If you meant string
Option 2: var x: i32 = 42;              // If you meant integer
```

**Features:**
- Context-aware suggestions
- Multiple fix options
- Explanation of the issue

---

## 🚀 Installation

### Prerequisites
- Node.js 20+
- 8GB+ RAM (for local LLM inference)
- CUDA GPU (optional, for faster inference)

### Install

```bash
# Clone repository
git clone https://github.com/fulgidus/zignet.git
cd zignet

# Install dependencies
pnpm install

# Download fine-tuned model (auto-downloads on first run)
# Model: fulgidus/zignet-qwen2.5-coder-7b-Q4_K_M (~4GB)
```

---

## 📖 Usage

### With Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "zignet": {
      "command": "node",
      "args": ["/path/to/zignet/dist/mcp-server.js"]
    }
  }
}
```

Then use in Claude:

```
You: "Analyze this Zig code for errors"
     [paste code]

Claude: "I'll use ZigNet to analyze this"
        [calls analyze_zig tool]
        "Found 1 type error: variable 'x' expects i32 but got []const u8"
```

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

| Component            | Status        | Notes                                   |
| -------------------- | ------------- | --------------------------------------- |
| Zig Compiler Wrapper | ✅ Complete    | ast-check + fmt integration             |
| System Zig Detection | ✅ Complete    | Auto-detects installed Zig versions     |
| Multi-version Cache  | ✅ Complete    | Downloads Zig 0.13-0.15 on demand       |
| MCP Server           | ✅ Complete    | analyze_zig + compile_zig tools working |
| LLM Fine-tuning      | 🔄 In Progress | Training on RTX 3090 (~32% complete)    |
| get_zig_docs         | ⏳ Waiting     | Blocked on fine-tuning completion       |
| suggest_fix          | ⏳ Waiting     | Blocked on fine-tuning completion       |
| GGUF Conversion      | ⏳ Planned     | Post-training quantization              |
| Claude Integration   | ⏳ Planned     | Final deployment                        |

**Current Phase:** Fine-tuning Qwen2.5-Coder-7B on 13,756 Zig examples

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
│   └── tools/
│       ├── analyze.ts        # analyze_zig tool (COMPLETE)
│       └── compile.ts        # compile_zig tool (COMPLETE)
├── scripts/
│   ├── train-qwen-standard.py   # Fine-tuning script (RUNNING)
│   ├── scrape-zig-repos.js      # Dataset collection
│   ├── install-zig.js           # Zig version installer
│   └── test-config.cjs          # Config system tests
├── data/
│   ├── training/             # 13,756 examples (train/val/test)
│   └── zig-docs/             # Scraped documentation
├── models/
│   └── zignet-qwen-7b/       # Fine-tuned model (output)
├── tests/                    # Unit tests
├── docs/
│   ├── AGENTS.md             # Detailed project spec
│   └── ARCHITECTURE.md       # Technical details
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

**Status:** 🔄 Active development - Fine-tuning in progress (ETA: Oct 26, 2025 23:30 CET)
