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

### Standalone CLI (coming soon)

```bash
pnpm run analyze -- file.zig
pnpm run format -- file.zig
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
│                ▼                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ Analysis Engine                              │   │
│  │ - Lexer → Parser → Type Checker → CodeGen   │   │
│  └─────────────┬────────────────────────────────┘   │
│                ▼                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ Fine-tuned LLM (Qwen2.5-Coder-7B)            │   │
│  │ - Documentation lookup                       │   │
│  │ - Intelligent suggestions                    │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Why this architecture?**
- **Deterministic analysis** (Lexer/Parser/TypeChecker) for reliability
- **LLM-powered suggestions** (get_zig_docs, suggest_fix) for intelligence
- **No external API calls** (local inference via node-llama-cpp)
- **Fast** (< 100ms for analysis, < 2s for LLM suggestions)

---

## 🧪 Development Status

| Component          | Status        | Notes                                  |
| ------------------ | ------------- | -------------------------------------- |
| Lexer              | ✅ Complete    | Full Zig 0.15 token support            |
| Parser             | ✅ Complete    | Functions, structs, generics, comptime |
| Type Checker       | ✅ Complete    | Type validation, scope tracking        |
| Code Generator     | ✅ Complete    | AST → Zig formatting                   |
| LLM Fine-tuning    | 🔄 In Progress | Training on RTX 3090 (6-10h)           |
| MCP Server         | ⏳ Planned     | Phase 3 (after fine-tuning)            |
| GGUF Conversion    | ⏳ Planned     | Post-training quantization             |
| Claude Integration | ⏳ Planned     | Final deployment                       |

**Current Phase:** Fine-tuning Qwen2.5-Coder-7B on 13,756 Zig examples (97% repos, 3% docs)

---

## 📦 Project Structure

```
zignet/
├── src/
│   ├── lexer.ts              # Tokenization
│   ├── parser.ts             # AST generation
│   ├── type-checker.ts       # Type validation
│   ├── codegen.ts            # Code formatting
│   ├── mcp-server.ts         # MCP handler (TODO)
│   └── tools/                # Tool implementations (TODO)
├── scripts/
│   ├── train-qwen-standard.py   # Fine-tuning script (running)
│   ├── scrape-zig-repos.js      # Dataset collection
│   └── compare-models.js        # Model benchmarking
├── data/
│   ├── training/             # 13,756 examples (train/val/test)
│   └── zig-docs/             # Scraped documentation
├── models/
│   └── zignet-qwen-7b/       # Fine-tuned model (output)
├── tests/                    # Unit tests
├── docs/
│   ├── AGENTS.md             # Detailed project spec
│   ├── TRAINING_GUIDE.md     # Fine-tuning guide
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
