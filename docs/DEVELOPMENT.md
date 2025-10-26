# ZigNet Development Guide

## 🛠️ Configurazione Ambiente

### Prerequisiti
- Node.js >= 18.0.0
- pnpm (o npm)

### Installazione
```bash
pnpm install
```

## 📜 Script Disponibili

### Build
```bash
pnpm build          # Compila TypeScript → JavaScript
pnpm build:watch    # Watch mode per sviluppo
pnpm clean          # Pulisce la directory dist/
```

### Testing
```bash
pnpm test              # Esegue tutti i test
pnpm test:watch        # Watch mode per i test
pnpm test:coverage     # Test con coverage report

# E2E Tests (27 tests)
pnpm test tests/e2e/mcp-integration.test.ts

# Solo test deterministici (no LLM richiesto)
SKIP_LLM_TESTS=1 pnpm test tests/e2e

# Test specifici
pnpm test -- lexer          # Test lexer
pnpm test -- parser         # Test parser
pnpm test -- type-checker   # Test type-checker
```

### Linting & Formatting
```bash
pnpm lint           # Controlla errori ESLint
pnpm lint:fix       # Corregge errori ESLint automaticamente
pnpm format         # Formatta il codice con Prettier
pnpm format:check   # Verifica formattazione senza modificare
pnpm typecheck      # Controlla i tipi TypeScript senza compilare
```

## 📁 Struttura del Progetto

```
zignet/
├── src/
│   ├── lexer.ts          ✅ Lexer completo (100% coverage)
│   ├── parser.ts         ✅ Parser completo (AST generation)
│   ├── type-checker.ts   ✅ Type checker completo
│   ├── codegen.ts        ✅ Code generator completo
│   ├── config.ts         ✅ Sistema di configurazione
│   ├── mcp-server.ts     ✅ MCP server completo
│   ├── zig/
│   │   ├── manager.ts    ✅ Multi-version Zig manager
│   │   └── executor.ts   ✅ zig ast-check + fmt wrapper
│   ├── llm/
│   │   ├── model-downloader.ts  ✅ Auto-download GGUF
│   │   └── session.ts           ✅ node-llama-cpp integration
│   └── tools/
│       ├── analyze.ts    ✅ analyze_zig tool
│       ├── compile.ts    ✅ compile_zig tool
│       ├── docs.ts       ✅ get_zig_docs tool
│       └── suggest.ts    ✅ suggest_fix tool
├── tests/
│   ├── lexer.test.ts     ✅ 33 test passati
│   ├── parser.test.ts    ✅ Test completi
│   ├── type-checker.test.ts  ✅ Test completi
│   ├── codegen.test.ts   ✅ Test completi
│   └── e2e/
│       ├── mcp-integration.test.ts  ✅ 27 E2E tests
│       └── README.md                ✅ Testing guide
├── dist/                 # Output compilato (gitignored)
├── coverage/             # Report coverage (gitignored)
└── docs/
    ├── AGENTS.md         ✅ Project specification
    ├── ARCHITECTURE.md   ✅ Technical details
    ├── DEVELOPMENT.md    📄 This file
    └── TESTING.md        ✅ Testing documentation
```

## 📊 Test Coverage

### Unit Tests
- **Lexer**: 100% Stmts | 99.02% Branch | 100% Funcs | 100% Lines (33 tests)
- **Parser**: Complete coverage (AST generation, error handling)
- **Type Checker**: Complete coverage (type validation, semantic analysis)
- **Code Generator**: Complete coverage (code emission, formatting)

### E2E Tests (27 total)
See [tests/e2e/README.md](../tests/e2e/README.md) for detailed testing guide.

**Test Categories:**
- ✅ **Tool 1 (analyze_zig)**: 4 tests - Zig compiler validation
- ✅ **Tool 2 (compile_zig)**: 3 tests - Zig formatter
- ✅ **Tool 3 (get_zig_docs)**: 5 tests - LLM documentation lookup
- ✅ **Tool 4 (suggest_fix)**: 5 tests - LLM error fix suggestions
- ✅ **Integration**: 3 tests - Combined tool workflows
- ✅ **Performance**: 3 tests - Resource management, concurrency
- ✅ **Edge Cases**: 4 tests - Empty code, long code, invalid input

**Execution Time:**
- Without LLM model: 8.7 seconds (deterministic tests only)
- With LLM model: 60-120 seconds (includes model loading + inference)

**Test Behavior:**
- Deterministic tests (12): Always run, use Zig compiler directly
- LLM tests (15): Auto-skip if model not found, graceful degradation
- CI/CD ready: Runs on GitHub Actions without GPU requirements

### Coverage Reports

```bash
| File     | % Stmts | % Branch | % Funcs | % Lines |
| -------- | ------- | -------- | ------- | ------- |
| lexer.ts | 100     | 99.02    | 100     | 100     |
```

## 🔧 Configurazione

### TypeScript (`tsconfig.json`)
- Target: ES2022
- Strict mode abilitato
- Output: `dist/`
- Source maps: ✅

### ESLint (`eslint.config.js`)
- Parser: `@typescript-eslint/parser`
- Regole: TypeScript + Prettier
- Type-aware linting: ✅

### Prettier (`.prettierrc.json`)
- Single quotes: ✅
- Semicolons: ✅
- Print width: 100
- Tab width: 2 spazi

### Jest (`jest.config.js`)
- Preset: ts-jest
- Coverage: lcov + html
- Test match: `**/*.test.ts`, `**/*.spec.ts`

## 🚀 Workflow di Sviluppo

### 1. Sviluppo con Watch Mode
```bash
# Terminal 1: Build automatico
pnpm build:watch

# Terminal 2: Test automatici
pnpm test:watch
```

### 2. Prima di Committare
```bash
pnpm typecheck    # Controlla tipi
pnpm lint:fix     # Corregge linting
pnpm format       # Formatta codice
pnpm test         # Esegue test
```

### 3. Workflow Completo
```bash
pnpm clean && pnpm build && pnpm lint && pnpm test:coverage
```

## 📊 Test Metrics

### Lexer Tests (33 total)
- ✅ Keywords (2 tests)
- ✅ Types (1 test)
- ✅ Literals (7 tests)
- ✅ Operators (6 tests)
- ✅ Punctuation (3 tests)
- ✅ Comments (2 tests)
- ✅ Complex Code (3 tests)
- ✅ Line/Column Tracking (2 tests)
- ✅ Error Handling (2 tests)
- ✅ Edge Cases (3 tests)
- ✅ Token toString (1 test)

---

## 🧪 E2E Testing Guide

### Overview

ZigNet uses a comprehensive E2E test suite to validate all MCP tools in realistic scenarios. Tests are designed to run both with and without the LLM model, enabling flexible CI/CD integration.

### Test Architecture

**Conditional LLM Testing:**
```typescript
let hasLLM = false;

beforeAll(async () => {
  const modelPath = path.join(os.homedir(), ".zignet/models/zignet-qwen-7b-q4km.gguf");
  hasLLM = fs.existsSync(modelPath);
  
  if (!hasLLM) {
    console.log("⚠️  LLM model not found, skipping LLM tests");
    return;
  }
  
  // Dynamically import LLM modules only if model exists
  const { getLlama } = await import("node-llama-cpp");
  // ... initialize LLM
}, 120000);
```

**Test Pattern:**
```typescript
it("should use LLM feature", async () => {
  if (!hasLLM) return; // Graceful skip
  
  const result = await getZigDocs({ topic: "comptime" });
  expect(result.content).toContain("compile-time");
}, 30000);
```

### Running E2E Tests

```bash
# All E2E tests (27 tests)
pnpm test tests/e2e/mcp-integration.test.ts

# Deterministic tests only (12 tests, no LLM required)
SKIP_LLM_TESTS=1 pnpm test tests/e2e

# With verbose output
pnpm test tests/e2e/mcp-integration.test.ts --verbose

# Watch mode for development
pnpm test:watch tests/e2e
```

### Environment Variables

| Variable                    | Default                                    | Description                      |
| --------------------------- | ------------------------------------------ | -------------------------------- |
| `ZIGNET_MODEL_PATH`         | `~/.zignet/models/zignet-qwen-7b-q4km.gguf` | Path to GGUF model               |
| `ZIGNET_MODEL_AUTO_DOWNLOAD`| `false`                                    | Auto-download model if missing   |
| `ZIGNET_GPU_LAYERS`         | `35`                                       | GPU offload layers (0 = CPU only)|
| `ZIG_SUPPORTED`             | `0.13.0,0.14.1,0.15.2`                     | Supported Zig versions           |
| `ZIG_DEFAULT`               | `0.15.2`                                   | Default Zig version              |
| `SKIP_LLM_TESTS`            | `false`                                    | Force skip LLM tests             |

### Test Categories Breakdown

#### 1. Tool 1: analyze_zig (4 tests) - Deterministic
- ✅ Validates correct Zig code
- ✅ Detects syntax errors
- ✅ Detects type mismatches
- ✅ Handles comptime expressions

**Example:**
```typescript
const result = await analyzeZig({
  code: "fn add(a: i32, b: i32) i32 { return a + b; }",
});
expect(result.errors).toHaveLength(0);
expect(result.content[0].text).toContain("Analysis successful");
```

#### 2. Tool 2: compile_zig (3 tests) - Deterministic
- ✅ Formats simple functions
- ✅ Preserves semantics after formatting
- ✅ Handles struct definitions

**Example:**
```typescript
const result = await compileZig({
  code: "fn add(a:i32,b:i32)i32{return a+b;}",
});
expect(result.content[0].text).toContain("fn add(a: i32, b: i32) i32");
```

#### 3. Tool 3: get_zig_docs (5 tests) - LLM-powered
- ✅ Retrieves basic topic documentation
- ✅ Retrieves intermediate topic documentation
- ✅ Retrieves advanced topic documentation
- ✅ Handles memory management topics
- ✅ Handles generics topics

**Example:**
```typescript
if (!hasLLM) return;

const result = await getZigDocs({
  topic: "comptime",
  detail_level: "advanced",
});
expect(result.content[0].text).toContain("comptime");
```

#### 4. Tool 4: suggest_fix (5 tests) - LLM-powered
- ✅ Suggests fixes for type errors
- ✅ Suggests fixes for syntax errors
- ✅ Suggests fixes for undefined variables
- ✅ Suggests fixes for error set issues
- ✅ Provides multiple fix suggestions

**Example:**
```typescript
if (!hasLLM) return;

const result = await suggestFix({
  error_message: "Type mismatch: cannot assign string to i32",
  code_context: 'var x: i32 = "hello";',
  error_type: "type_mismatch",
});
expect(result.content[0].text).toContain("i32");
```

#### 5. Integration Tests (3 tests) - Mixed
- ✅ Analyze error → Suggest fix workflow
- ✅ Validate fix → Format workflow
- ✅ Get docs → Validate comptime workflow

**Example:**
```typescript
// Step 1: Analyze code with error
const analysis = await analyzeZig({ code: badCode });
expect(analysis.errors.length).toBeGreaterThan(0);

// Step 2: Get fix suggestion
if (hasLLM) {
  const fix = await suggestFix({
    error_message: analysis.errors[0].message,
    code_context: badCode,
  });
  expect(fix.content[0].text).toContain("suggestion");
}
```

#### 6. Performance Tests (3 tests) - Stress Tests
- ✅ Multiple sequential LLM queries
- ✅ Clean up LLM resources properly
- ✅ Handle concurrent analyze operations

**Example:**
```typescript
const promises = Array(5)
  .fill(null)
  .map(() => analyzeZig({ code: validCode }));

const results = await Promise.all(promises);
results.forEach((r) => expect(r.errors).toHaveLength(0));
```

#### 7. Edge Cases (4 tests) - Error Paths
- ✅ Handles empty code gracefully
- ✅ Handles very long code (100+ functions)
- ✅ Handles invalid LLM topics gracefully
- ✅ Handles malformed error messages

**Example:**
```typescript
const result = await analyzeZig({ code: "" });
expect(result.errors.length).toBeGreaterThan(0);
expect(result.content[0].text).toContain("empty");
```

### CI/CD Integration

**GitHub Actions Example:**
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run deterministic tests only
        run: SKIP_LLM_TESTS=1 pnpm test tests/e2e
        env:
          NODE_ENV: test
```

**With LLM Model (optional):**
```yaml
      - name: Download LLM model
        run: |
          mkdir -p ~/.zignet/models
          wget -O ~/.zignet/models/zignet-qwen-7b-q4km.gguf \
            https://huggingface.co/fulgidus/zignet-qwen2.5-coder-7b/resolve/main/gguf/zignet-qwen-7b-q4km.gguf
      
      - name: Run all E2E tests (including LLM)
        run: pnpm test tests/e2e
        env:
          ZIGNET_GPU_LAYERS: 0  # CPU-only for GitHub Actions
```

### Adding New Tests

**Pattern for deterministic tests:**
```typescript
it("should test new feature", async () => {
  const result = await analyzeZig({ code: testCode });
  expect(result.errors).toHaveLength(0);
});
```

**Pattern for LLM tests:**
```typescript
it("should test LLM feature", async () => {
  if (!hasLLM) return; // Always add this guard
  
  const result = await getZigDocs({ topic: "new_topic" });
  expect(result.content[0].text).toContain("expected_content");
}, 30000); // Timeout for LLM operations
```

### Troubleshooting

**Model not found:**
```bash
# Check model path
ls -lh ~/.zignet/models/zignet-qwen-7b-q4km.gguf

# Download manually
mkdir -p ~/.zignet/models
wget -O ~/.zignet/models/zignet-qwen-7b-q4km.gguf \
  https://huggingface.co/fulgidus/zignet-qwen2.5-coder-7b/resolve/main/gguf/zignet-qwen-7b-q4km.gguf
```

**Tests timeout:**
```bash
# Increase Jest timeout (default: 120s for LLM)
pnpm test tests/e2e -- --testTimeout=180000
```

**Zig version mismatch:**
```bash
# Check installed Zig version
zig version

# Install specific version
ZIG_DEFAULT=0.15.2 pnpm test tests/e2e
```

### Performance Benchmarks

| Test Category  | Tests | Avg Time | Notes                     |
| -------------- | ----- | -------- | ------------------------- |
| analyze_zig    | 4     | 400ms    | Deterministic, fast       |
| compile_zig    | 3     | 550ms    | Deterministic, fast       |
| get_zig_docs   | 5     | 8s       | LLM-powered, model-dependent |
| suggest_fix    | 5     | 10s      | LLM-powered, model-dependent |
| Integration    | 3     | 5s       | Mixed (LLM + deterministic) |
| Performance    | 3     | 2s       | Concurrent operations     |
| Edge Cases     | 4     | 580ms    | Error handling paths      |
| **TOTAL**      | **27**| **323ms**| **8.7s (without LLM)**    |

**With LLM model (GPU-accelerated):**
- First run: ~60s (model loading + inference)
- Subsequent runs: ~30s (model cached in VRAM)

For complete testing documentation, see [tests/e2e/README.md](../tests/e2e/README.md)

---

## 🎯 Stato Attuale e Prossimi Passi

### ✅ Completato (Phase 1-4)
- ✅ Lexer completo (100% coverage)
- ✅ Parser completo (AST generation)
- ✅ Type Checker completo (semantic analysis)
- ✅ Code Generator completo (code emission)
- ✅ MCP Server completo (4 tools)
- ✅ Zig Compiler integration (ast-check + fmt)
- ✅ LLM fine-tuning (Qwen2.5-Coder-7B, 13,756 examples)
- ✅ GGUF conversion (Q4_K_M, 4.4GB)
- ✅ E2E test suite (27 tests, 100% pass rate)
- ✅ Comprehensive documentation

### ⏳ Prossimi Passi (Phase 5: Deployment)
- [ ] Pubblicare su npm (`@fulgidus/zignet`)
- [ ] Creare release GitHub (v1.0.0)
- [ ] Testare integrazione Claude Desktop
- [ ] Testare integrazione VS Code + GitHub Copilot
- [ ] Creare video demo/tutorial
- [ ] Pubblicare su Hacker News / Reddit
- [ ] Community feedback e iterazione

### 🎯 Future Enhancements
- [ ] Support for more Zig versions (0.16.0+)
- [ ] Incremental re-training pipeline
- [ ] Plugin system for custom analyzers
- [ ] LSP (Language Server Protocol) integration
- [ ] Web-based playground

## 📚 Risorse

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Documentation](https://jestjs.io/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Zig Language Reference](https://ziglang.org/documentation/master/)

## 🐛 Troubleshooting

### Jest non trova i moduli
```bash
pnpm clean
pnpm install
pnpm build
```

### ESLint errori strani
```bash
rm -rf node_modules/.cache
pnpm lint:fix
```

### TypeScript errori di tipo
```bash
pnpm typecheck
```

---

**Status**: ✅ Phase 4 Complete - All core features implemented, 27/27 E2E tests passing  
**Last Updated**: 2025-10-26
