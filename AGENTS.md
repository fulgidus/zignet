# AGENTS.md - ZigNet Project Specification

**Last Updated**: 2025-10-26 02:50:06 UTC  
**Status**: Active Development - Phase 3.1 (Parser Implementation)  
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

| Layer | Technology | Reason |
|-------|-----------|--------|
| Runtime | Node.js 20+ | MCP works with Node.js |
| Language | TypeScript | Type safety, better DX |
| Build | tsc | Fast compilation |
| Testing | Vitest + Jest | Fast, parallel tests |
| Linting | ESLint | Code quality |
| MCP Protocol | @modelcontextprotocol/sdk | Official MCP library |

### No External Dependencies (Deliberate)
- ❌ NO Ollama in production (LLM runs in Claude)
- ❌ NO HTTP calls (self-contained)
- ❌ NO database (stateless)
- ❌ NO file I/O (pure computation)

**Why**: Simplicity, speed, reliability, deployability.

---

## 5. DEVELOPMENT PHASES

### Phase 1: Infrastructure ✅ COMPLETE
- ✅ Docker + Ollama setup
- ✅ Model benchmarking (Phi, DeepSeek, Mistral)
- ✅ TypeScript + Linting + Testing infrastructure

### Phase 2: Core Compiler (IN PROGRESS)
- ✅ **Lexer** (src/lexer.ts) - DONE
- 🔄 **Parser** (src/parser.ts) - IN PROGRESS (User implementing)
- ⏳ **Type Checker** (src/type-checker.ts) - TODO
- ⏳ **Code Generator** (src/codegen.ts) - TODO

### Phase 3: MCP Integration (AFTER Parser)
- ⏳ **MCP Server** (src/mcp-server.ts)
- ⏳ **Tool Implementations**

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