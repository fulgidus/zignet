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
│   ├── parser.ts         ⏳ TODO
│   ├── type-checker.ts   ⏳ TODO
│   ├── codegen.ts        ⏳ TODO
│   └── llm-integration.ts ⏳ TODO
├── tests/
│   ├── lexer.test.ts     ✅ 33 test passati
│   └── parser.test.ts    ⏳ TODO
├── dist/                 # Output compilato (gitignored)
├── coverage/             # Report coverage (gitignored)
└── docs/
    └── ARCHITECTURE.md
```

## 🧪 Test Coverage

**Lexer: 100% Stmts | 99.02% Branch | 100% Funcs | 100% Lines**

```
File      | % Stmts | % Branch | % Funcs | % Lines
----------|---------|----------|---------|--------
lexer.ts  |     100 |    99.02 |     100 |     100
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

## 🎯 Prossimi Passi

### Phase 3.2: Parser
- [ ] Creare `src/parser.ts`
- [ ] Implementare AST nodes
- [ ] Parser per funzioni
- [ ] Parser per structs
- [ ] Parser per espressioni
- [ ] Test unitari parser
- [ ] Coverage > 95%

### Phase 3.3: Type Checker
- [ ] Creare `src/type-checker.ts`
- [ ] Validazione tipi base
- [ ] Gestione generics
- [ ] Error reporting
- [ ] Test unitari

### Phase 4: LLM Integration
- [ ] Creare `src/llm-integration.ts`
- [ ] Integrazione Ollama
- [ ] Prompt engineering
- [ ] Error suggestion system

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

**Status**: ✅ Lexer completo, TypeScript configurato, test suite attiva
**Last Updated**: 2025-10-26
