# AGENTS.md - ZigNet Project Specification

**Last Updated**: 2025-10-26 17:30:00 UTC  
**Status**: Active Development - Phase 2.5 (Fine-Tuning IN PROGRESS - 32.5% COMPLETE) + Phase 3 (MCP Integration ACTIVE - Config System COMPLETE)  
**Owner**: fulgidus  
**Repository**: https://github.com/fulgidus/zignet

---

## 1. PROJECT OVERVIEW

### Mission
ZigNet is an **MCP (Model Context Protocol) Server** that integrates with Claude (or other LLMs) to provide intelligent Zig code analysis, validation, and assistance.

### Purpose
- Enable Claude to analyze Zig code without leaving the chat
- Validate Zig syntax and type correctness in real-time
- Generate corrected Zig code based on validation results
- Provide Zig documentation context for advanced features

### Use Case
**Developer using Claude:**
```
User: "Analyze this Zig code for me"
      [pastes Zig code]
↓
Claude: "I'll use ZigNet to analyze this"
↓
Claude calls: ZigNet MCP /analyze_zig
↓
ZigNet: "Type error at line 5: i32 cannot be string"
↓
Claude: "Here's the fix: change x to u32"
```

### Target Users
- Zig developers using Claude
- Advanced Zig projects (NOT beginner tutorials)
- Production-grade code validation

---

## 2. ARCHITECTURE

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Claude (Claude.ai / Claude API)                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ MCP Protocol (JSON-RPC)
                     │
┌────────────────────▼────────────────────────────────────────┐
│ ZigNet MCP Server (Node.js/TypeScript)                      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ MCP Handler Layer                                    │   │
│  │ - Tool routing                                       │   │
│  │ - Request validation                                │   │
│  │ - Response formatting                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                     ↓                                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Analysis Engine (Core Logic)                         │   │
│  │                                                      │   │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────┐  │   │
│  │  │  Lexer     │→ │  Parser    │→ │ TypeChecker  │  │   │
│  │  │ (Tokenize) │  │ (Build AST)│  │ (Validate)   │  │   │
│  │  └────────────┘  └────────────┘  └──────────────┘  │   │
│  │                                                      │   │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────┐  │   │
│  │  │ CodeGen    │  │ ErrorMap   │  │ DocLookup    │  │   │
│  │  │ (Emit Code)│  │ (Error DB) │  │ (Zig Docs)   │  │   │
│  │  └────────────┘  └────────────┘  └──────────────┘  │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Component Interaction

```
INPUT: Zig source code
  ↓
[LEXER] Tokenize → Token[]
  ↓
[PARSER] Parse tokens → AST
  ↓
[TYPE_CHECKER] Validate types → Typed AST or Error[]
  ↓
IF errors:
  [ERROR_MAP] Format error → Error Report
  ELSE:
  [CODEGEN] Generate clean Zig → Zig String
  ↓
[FORMATTER] Pretty-print → Final Output
  ↓
RESPONSE: JSON to Claude
```

---

## 3. MCP SERVER DESIGN

### Server Entry Point

```typescript
// src/mcp-server.ts
const server = new Server({
  name: "zignet",
  version: "0.1.0",
});

// Register tools available to Claude
server.setRequestHandler(CallToolRequestSchema, handleToolCall);
```

### Exposed Tools

#### Tool 1: `analyze_zig`
**Purpose**: Analyze Zig code for errors and validation

**Request**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "analyze_zig",
    "arguments": {
      "code": "fn add(a: i32, b: i32) i32 {\n  return a + b;\n}",
      "action": "lint"
    }
  }
}
```

**Response (Success)**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "✅ Analysis Result:\n- Syntax: Valid\n- Type Check: PASS\n- Warnings: 0\n- Errors: 0"
    }
  ]
}
```

**Response (Error)**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "❌ Type Error:\nCannot assign string to i32\nExpected: i32\nGot: []const u8\n\nSuggestion: Change variable type to []const u8 or convert string to i32"
    }
  ]
}
```

---

#### Tool 2: `compile_zig`
**Purpose**: Compile Zig code and generate output

**Request**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "compile_zig",
    "arguments": {
      "code": "fn add(a: i32, b: i32) i32 { return a + b; }",
      "output_format": "zig"
    }
  }
}
```

**Response**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "✅ Compiled successfully:\n\n```zig\nfn add(a: i32, b: i32) i32 {\n    return a + b;\n}\n```"
    }
  ]
}
```

---

#### Tool 3: `get_zig_docs`
**Purpose**: Retrieve Zig documentation for specific topics

**Request**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "get_zig_docs",
    "arguments": {
      "topic": "comptime",
      "detail_level": "advanced"
    }
  }
}
```

**Response**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "# Zig Comptime Documentation\n\n`comptime` is used for compile-time evaluation...\n\nExample:\n```zig\ncomptime var x = 5;\n...\n```"
    }
  ]
}
```

---

#### Tool 4: `suggest_fix`
**Purpose**: Get intelligent suggestion for fixing Zig code errors

**Request**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "suggest_fix",
    "arguments": {
      "error": "Type mismatch: cannot assign string to i32",
      "code": "var x: i32 = \"hello\";",
      "context": "variable initialization"
    }
  }
}
```

**Response**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "💡 Suggestion:\n\n**Problem**: i32 expects integer, got string\n\n**Fix Option 1** (if you meant string):\n```zig\nvar x: []const u8 = \"hello\";\n```\n\n**Fix Option 2** (if you meant integer):\n```zig\nvar x: i32 = 42;\n```"
    }
  ]
}
```

---

## 4. TECH STACK

### Core Technologies

| Layer        | Technology                | Reason                 |
| ------------ | ------------------------- | ---------------------- |
| Runtime      | Node.js 20+               | MCP works with Node.js |
| Language     | TypeScript                | Type safety, better DX |
| Build        | tsc                       | Fast compilation       |
| Testing      | Vitest + Jest             | Fast, parallel tests   |
| Linting      | ESLint                    | Code quality           |
| MCP Protocol | @modelcontextprotocol/sdk | Official MCP library   |
| LLM Engine   | node-llama-cpp            | Local Zig expert model |

### LLM Role & Model Selection

**Purpose of LLM in ZigNet**:
- 🎯 **Documentation lookup**: Retrieve Zig language docs (via `get_zig_docs` tool)
- 🎯 **Intelligent fixes**: Suggest code corrections (via `suggest_fix` tool)
- ❌ **NOT used for parsing/validation**: Parser + Type Checker handle this (deterministic, fast)

**Model Benchmarking** (Phase 1):
Tested models: Phi-2.7b, DeepSeek-Coder (1.3b, 6.7b), Mistral-7b, CodeLlama-7b, Llama3.2-3b, Qwen2.5-Coder (0.5b, 1.5b, 7b)
- Results in `scripts/test-results/` - **ALL models: 100% pass rate** ✅
- Analysis tool: `pnpm run compare-models`
- Integration: `node-llama-cpp` (local, no API calls)

**Benchmark Results** (all 100% pass rate):
1. **Qwen2.5-Coder-0.5B**: ⚡ Fastest (3.94s) - ❌ Inventa sintassi, inutilizzabile
2. **Qwen2.5-Coder-1.5B**: Fast (7.48s) - ⚠️ Impreciso per Zig avanzato
3. **Llama3.2-3B**: Balanced (12.27s) - ⭐⭐⭐⭐ Ottima qualità
4. **CodeLlama-7B**: Standard (24.61s) - ⚠️ Confonde Zig con Rust
5. **DeepSeek-Coder-6.7B**: Quality (27.86s) - ⭐⭐⭐⭐⭐ Didattico
6. **Qwen2.5-Coder-7B**: Best (29.58s) - ⭐⭐⭐⭐⭐ Sintassi idiomatica

**✅ SELECTED MODEL: Qwen2.5-Coder-7B**
- **Why**: Sintassi Zig moderna e idiomatica, zero errori gravi, comprende features avanzate
- **Quality**: ⭐⭐⭐⭐⭐ (best-in-class per Zig)
- **Speed**: 29.58s base → ~15-20s post fine-tuning + quantization
- **Upload target**: `fulgidus/zignet-qwen2.5-coder-7b`

### No External Dependencies (For Core Analysis)
- ✅ **Local LLM** via node-llama-cpp (for `get_zig_docs` and `suggest_fix` tools)
- ❌ NO Ollama in production (development testing only)
- ❌ NO HTTP calls for core validation (self-contained parser/type-checker)
- ❌ NO database (stateless)
- ❌ NO file I/O (pure computation)

**Why**: Parser/Type-Checker are deterministic and fast. LLM is ONLY for documentation lookups and intelligent suggestions.

### Zig Version Support Strategy

**Current Target**: Zig 0.15.0 (latest stable)  
**Supported Versions**: 0.13.x, 0.14.x, 0.15.x (last 3 major releases)

**Version Management**:
- Primary development: Zig 0.15.0
- Backward compatibility: 0.14.x and 0.13.x for common features
- Breaking changes: Documented in migration guides
- Dataset includes version-specific examples

**Update Strategy**:
1. Monitor Zig releases (ziglang.org)
2. Run scraper on new docs: `pnpm run scrape-docs`
3. Re-train fine-tuned model with new dataset
4. Update parser for syntax changes
5. Run regression tests on all supported versions
6. Deploy updated model to HuggingFace

---

## 5. DEVELOPMENT PHASES

### Phase 1: Infrastructure ✅ COMPLETE
- ✅ Docker + Ollama setup
- ✅ Model benchmarking (Phi, DeepSeek, Mistral, Qwen2.5-Coder, CodeLlama)
- ✅ TypeScript + Linting + Testing infrastructure

### Phase 1.5: Data Collection ✅ COMPLETE
- ✅ **Documentation Scraper** (scripts/scrape-zig-docs.js)
- ✅ **Run scraper** for Zig 0.13, 0.14.1, 0.15.2 → 1,787 examples collected
- ✅ **Model comparison tool** (scripts/compare-models.js)
- ⏳ **Curate dataset** (validate examples with parser, add community code)
- ⏳ **Split dataset** (train/validation/test 70/15/15)

### Phase 2: Core Compiler ✅ COMPLETE
- ✅ **Lexer** (src/lexer.ts) - DONE
- ✅ **Parser** (src/parser.ts) - DONE
- ✅ **Type Checker** (src/type-checker.ts) - DONE
- ✅ **Code Generator** (src/codegen.ts) - DONE

### Phase 2.5: Model Fine-Tuning 🔄 IN PROGRESS (TRAINING ACTIVE - 26% COMPLETE)
- ✅ **Select base model** → **Qwen2.5-Coder-7B** (best quality, idiomatica Zig)
- ✅ **Prepare training data** → **13,756 examples** (9,629 train, 2,063 val, 2,064 test)
- 🔄 **Fine-tune model** → **RUNNING NOW** (QLoRA on RTX 3090, Step 473/1806 - 26.1%)
  - Hardware: RTX 3090 (24GB VRAM, 100% util, 80°C, 351W)
  - Method: QLoRA (4-bit) without Unsloth (compatibility issues)
  - Training: 3 epochs, 1,806 steps, batch 16, lr 2e-4
  - Script: `scripts/train-qwen-standard.py`
  - Log: `training.log` (monitor: `pnpm run monitor-training`)
  - PID: 922643 (started Oct 26 15:45:47 CET)
  - Speed: 5.67s/step, ETA: ~2h remaining (~18:00 CET)
- ⏳ **Validate model** (test on Zig-specific benchmarks) - AFTER TRAINING
- ⏳ **Upload to HuggingFace** → `fulgidus/zignet-qwen2.5-coder-7b` - AFTER TRAINING
- ⏳ **Convert to GGUF** (Q4_K_M quantization for node-llama-cpp) - AFTER TRAINING
- ⏳ **Integrate with ZigNet** (MCP tools: get_zig_docs, suggest_fix) - PHASE 3

**Training Status (Real-time)**:
- Started: Oct 26 15:45:47 CET 2025
- Current: Step 473/1806 (26.1%), Epoch 1/3
- Speed: 5.67 seconds per step
- ETA: ~2.0h remaining (completion ~18:00 CET)
- Output: `models/zignet-qwen-7b/final/`
- Monitor: `pnpm run monitor-training` or `tail -f training.log`

**Selected Model Details**:
- **Base**: Qwen/Qwen2.5-Coder-7B-Instruct
- **Quality**: ⭐⭐⭐⭐⭐ (zero errori gravi, sintassi moderna)
- **Speed**: 29.58s base → ~15-20s post quantization
- **Size**: 7B params → ~4GB GGUF Q4_K_M
- **Why**: Migliore comprensione idiomi Zig (comptime, generics, error handling)

### Phase 3: MCP Integration ✅ CORE COMPLETE (Config System + Tools)
- ✅ **MCP Server** (src/mcp-server.ts) - Complete with dynamic config
- ✅ **Configuration System** (src/config.ts) - Environment-based version management
  - ZIG_SUPPORTED (comma-separated versions)
  - ZIG_DEFAULT (single version, validated)
  - All components read from env vars
- ✅ **Zig Manager** (src/zig/manager.ts) - Multi-version download/cache system
- ✅ **Zig Executor** (src/zig/executor.ts) - ast-check + fmt integration
- ✅ **analyze_zig tool** (src/tools/analyze.ts) - Uses Zig compiler (100% accurate)
- ✅ **compile_zig tool** (src/tools/compile.ts) - Uses zig fmt (official formatter)
- ⏳ **get_zig_docs tool** (waiting for fine-tuned model)
- ⏳ **suggest_fix tool** (waiting for fine-tuned model)

### Phase 4: Testing & Polish
- ⏳ Unit tests for all components
- ⏳ Integration tests (end-to-end)
- ⏳ Error case handling

### Phase 5: Deployment
- ⏳ Package as executable
- ⏳ Create MCP manifest
- ⏳ Documentation & Release

---

## 6. COMPONENT SPECIFICATIONS

### 6.1 Lexer (src/lexer.ts) - ✅ COMPLETE

**Input**: Zig source code (string)  
**Output**: Token[]

**Supported Tokens**: Keywords, types, operators, punctuation, literals, identifiers  
**Features**: Line/column tracking, comment handling, string escapes

---

### 6.2 Parser (src/parser.ts) - 🔄 IN PROGRESS

**Input**: Token[]  
**Output**: ASTNode[] (or errors)

**Must Support**:
- ✅ Function definitions with parameters
- ✅ Struct definitions
- ✅ Type annotations
- ✅ Expressions (binary ops, calls, literals)
- ✅ Control flow (if/else, while, for)
- ✅ Generics <T>
- ✅ Comptime blocks
- ✅ Error reporting with position

---

### 6.3 Type Checker (src/type-checker.ts) - ⏳ TODO

**Input**: ASTNode[]  
**Output**: TypedASTNode[] | CompileError[]

**Responsibilities**:
- Track variable declarations (scope)
- Validate type compatibility
- Check function signatures
- Resolve generic types
- Detect undefined variables
- Detect type mismatches

---

### 6.4 Code Generator (src/codegen.ts) - ⏳ TODO

**Input**: TypedASTNode[]  
**Output**: Zig source code (string)

**Responsibilities**:
- Convert AST back to Zig syntax
- Proper indentation (2 spaces)
- Clean formatting
- Preserve semantics

---

### 6.5 MCP Server (src/mcp-server.ts) - ⏳ TODO

**Responsibilities**:
- Listen for MCP protocol messages
- Route requests to tool handlers
- Validate request schemas
- Format responses
- Error handling

---

## 7. API SPECIFICATIONS

### Request Format (All Tools)

```json
{
  "jsonrpc": "2.0",
  "id": "<unique-id>",
  "method": "tools/call",
  "params": {
    "name": "<tool-name>",
    "arguments": {
      ...tool-specific-args
    }
  }
}
```

### Response Format (Success)

```json
{
  "jsonrpc": "2.0",
  "id": "<matching-request-id>",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "<response-text>"
      }
    ]
  }
}
```

### Response Format (Error)

```json
{
  "jsonrpc": "2.0",
  "id": "<matching-request-id>",
  "error": {
    "code": -32603,
    "message": "Internal error",
    "data": {
      "details": "<error-details>"
    }
  }
}
```

---

## 8. TESTING STRATEGY

### Unit Tests

**Lexer Tests** (src/lexer.test.ts):
```typescript
describe("Lexer", () => {
  it("tokenizes simple function", () => {
    const code = "fn add(a: i32) i32 { return a; }";
    const tokens = new Lexer(code).tokenize();
    expect(tokens[0].type).toBe(TokenType.FN);
  });
});
```

**Parser Tests** (src/parser.test.ts):
```typescript
describe("Parser", () => {
  it("parses function definition", () => {
    const tokens = lexer.tokenize("fn add(a: i32) i32 { return a; }");
    const ast = new Parser(tokens).parse();
    expect(ast[0].kind).toBe("function");
  });
});
```

### Integration Tests

**End-to-End** (tests/e2e.test.ts):
```typescript
describe("ZigNet E2E", () => {
  it("analyzes valid code", async () => {
    const result = await analyzeZig("fn add(a: i32, b: i32) i32 { return a + b; }");
    expect(result.errors).toHaveLength(0);
  });
});
```

### Test Execution

```bash
pnpm test                    # All tests
pnpm test -- lexer          # Specific component
pnpm test:watch        # Watch mode
```

---

## 9. FILE STRUCTURE

```
zignet/
├── src/
│   ├── lexer.ts              ✅ Tokenizer
│   ├── parser.ts             🔄 AST builder (IN PROGRESS)
│   ├── type-checker.ts       ⏳ Type validator
│   ├── codegen.ts            ⏳ Code generator
│   ├── mcp-server.ts         ⏳ MCP handler
│   ├── tools/
│   │   ├── analyze.ts        ⏳ analyze_zig tool
│   │   ├── compile.ts        ⏳ compile_zig tool
│   │   ├── docs.ts           ⏳ get_zig_docs tool
│   │   └── suggest.ts        ⏳ suggest_fix tool
│   ├── types.ts              ✅ Type definitions
│   └── utils.ts              ✅ Utilities
│
├── tests/
│   ├── lexer.test.ts         ✅ Lexer tests
│   ├── parser.test.ts        ⏳ Parser tests
│   ├── type-checker.test.ts  ⏳ Type checker tests
│   └── fixtures/
│       └── zig/              ⏳ Test code samples
│
├── docs/
│   └── AGENTS.md             📄 This file
│
├── tsconfig.json             ✅ TypeScript config
├── eslint.config.js          ✅ Linting rules
├── package.json              ✅ Dependencies
└── README.md                 ✅ Quick start
```

---

## 10. DESIGN DECISIONS & RATIONALE

### Decision 1: Why MCP Server (Not CLI)?

**Chosen**: MCP Server

**Rationale**:
- Users already in Claude → no context switch
- LLM provides UI/UX
- Stateless = reliable
- No file I/O needed

---

### Decision 2: Why No Parser Before MCP?

**Initially**: Seemed unnecessary  
**Corrected**: Parser IS necessary

**Why**:
- Precise error detection (not LLM guesswork)
- Fast (< 100ms vs LLM speed)
- Enables advanced features (generics, comptime)
- Consistent & reliable validation

---

### Decision 3: Why TypeScript (Not Zig)?

**Chosen**: TypeScript (prototype phase)

**Rationale**:
- Faster iteration
- MCP SDK is JavaScript-first
- Can rewrite in Zig when stable

---

### Decision 4: No Line Numbers in Errors

**Intentional Design**:
- Errors focus on **what** and **how to fix**
- Users see context in Claude conversation

---

## 11. DEPLOYMENT

### Development
```bash
npm install
npm run build
npm run dev
```

### MCP Client Configuration
```json
{
  "mcpServers": {
    "zignet": {
      "command": "node",
      "args": ["./dist/mcp-server.js"]
    }
  }
}
```

---

## 12. DATA COLLECTION & FINE-TUNING ROADMAP

### Current Status (Phase 2.5)

✅ **Completed**:
- Documentation scraper (`scripts/scrape-zig-docs.js`)
- Dataset collection: 1,787 examples from Zig 0.13, 0.14.1, 0.15.2
- Model benchmarking: 14 models tested
- **Model selection: Qwen2.5-Coder-7B** ⭐
- Training pipeline design
- Version support strategy (0.13-0.15)

⏳ **Next Steps**:
1. ~~Run scraper~~ ✅ DONE (1,787 examples)
2. Optional: Augment dataset to 5k-10k (community code, error-fix pairs)
3. Fine-tune Qwen2.5-Coder-7B (Google Colab Pro, QLoRA)
4. Validate on test set (95%+ pass rate target)
5. Upload to HuggingFace: `fulgidus/zignet-qwen2.5-coder-7b`
6. Convert to GGUF Q4_K_M
7. Integrate with node-llama-cpp in MCP server

### Documentation

- **Quick Start**: `docs/DATA_COLLECTION.md`
- **Detailed Guide**: `docs/FINE_TUNING.md`
- **Benchmarks**: `scripts/test-results/`

### Dataset Structure

```
data/zig-docs/
├── zig-0.15.0-dataset.json    # Latest (primary)
├── zig-0.14.0-dataset.json    # Backward compat
├── zig-0.13.0-dataset.json    # Backward compat
├── zig-combined-dataset.json  # All merged
└── dataset-stats.json         # Metrics
```

### Model Lifecycle

```
New Zig Release (e.g., 0.16)
    ↓
Run Scraper (30 min)
    ↓
Merge with Existing Data (5 min)
    ↓
Incremental Fine-Tune (2-4 hours)
    ↓
Validate on Test Set (30 min)
    ↓
Upload to HuggingFace (1 hour)
    ↓
Update ZigNet Integration (1 hour)
    ↓
Deploy (10 min)
```

**Total turnaround**: ~1 day from Zig release to production update

### Success Metrics

- **Dataset**: 10,000+ examples, 100% syntax valid
- **Model**: 95%+ pass rate on benchmarks
- **Performance**: < 30s average response time
- **Accuracy**: 90%+ version-specific correctness