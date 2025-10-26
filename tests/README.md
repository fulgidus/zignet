# Testing Strategy

ZigNet uses a multi-layered testing approach to ensure reliability across platforms.

## Test Types

### 1. Unit Tests
Fast, isolated tests for individual components.

```bash
pnpm run test:unit
```

**Coverage:**
- Config system (`src/config.ts`)
- Zig manager (`src/zig/manager.ts`)
- Zig executor (`src/zig/executor.ts`)
- MCP tools (`src/tools/*.ts`)

### 2. E2E Tests
Integration tests that verify end-to-end workflows.

```bash
# Run E2E tests (no Zig installation)
pnpm run test:e2e

# Run E2E tests with Zig installation (slow)
pnpm run test:e2e:install
```

**Coverage:**
- System Zig detection
- Multi-version Zig management
- analyze_zig tool with real Zig compiler
- compile_zig tool with real formatter
- Cross-tool integration

### 3. CI/CD Tests (GitHub Actions)
Automated tests on every push/PR to `main` or `develop`.

**Platforms:**
- ✅ Ubuntu Latest (Linux x86_64)
- ✅ macOS Latest (macOS ARM64/x86_64)
- ✅ Windows Latest (Windows x86_64)

**Zig Versions:**
- ✅ 0.13.0
- ✅ 0.14.0
- ✅ 0.15.1

## Running Tests Locally

### Quick Test
```bash
pnpm run ci
```
Runs: lint → typecheck → build → test

### Full Test Suite
```bash
pnpm run test:all
```
Runs: unit tests + E2E tests

### Watch Mode
```bash
pnpm run test:watch
```

### Coverage Report
```bash
pnpm run test:coverage
open coverage/lcov-report/index.html
```

## Docker Testing

### Build Docker Image
```bash
pnpm run docker:build
```

### Run in Container
```bash
pnpm run docker:run
```

### Test Multi-platform Docker Build
```bash
docker buildx build --platform linux/amd64,linux/arm64 -t zignet:multi .
```

## CI/CD Workflows

### `.github/workflows/ci.yml`

**Triggers:**
- Push to `main` or `develop`
- Pull request to `main` or `develop`

**Jobs:**
1. **test** - Runs on Ubuntu/macOS/Windows
   - Lint, typecheck, build, unit tests
   - Config system tests
   - Coverage upload (Ubuntu only)

2. **test-zig-integration** - Tests Zig compiler integration
   - Matrix: Ubuntu/macOS × Zig 0.13/0.14/0.15
   - Installs Zig versions
   - Tests analyze_zig and compile_zig tools

3. **test-system-zig-detection** - Tests system Zig detection
   - Installs Zig in PATH
   - Verifies auto-detection works

4. **docker-build** - Validates Docker build
   - Builds container image
   - Uses BuildKit cache for speed

## Testing Without LLM

Since the fine-tuned LLM is still training, tests focus on:

✅ **Zig compiler integration** (100% functional)  
✅ **Multi-version support** (download, cache, execute)  
✅ **System detection** (use existing Zig if available)  
✅ **MCP tools** (analyze_zig, compile_zig)  
⏳ **LLM tools** (get_zig_docs, suggest_fix) - will be tested after training

## Environment Variables for Testing

```bash
# Skip slow Zig installation tests
export ZIGNET_TEST_INSTALL=0  # default

# Run full E2E tests including installation
export ZIGNET_TEST_INSTALL=1

# Override Zig versions for testing
export ZIG_SUPPORTED="0.15.0"
export ZIG_DEFAULT="0.15.0"
```

## Troubleshooting

### "Zig not found" in CI
- CI downloads Zig automatically
- Check `.github/workflows/ci.yml` for installation steps
- Verify `scripts/install-zig.js` works on target platform

### "Module not found" errors
- Run `pnpm run build` before tests
- Check `dist/` directory exists
- Verify `tsdown` compiled TypeScript correctly

### Timeout errors
- E2E tests have 30s timeout (configurable in `jest.config.js`)
- Zig downloads can take 10-30s depending on connection
- Use `ZIGNET_TEST_INSTALL=0` to skip installation tests

## Contributing

When adding new features:

1. **Add unit tests** for isolated logic
2. **Add E2E tests** for integration workflows
3. **Update CI matrix** if adding new Zig versions
4. **Run `pnpm run ci`** before committing
5. **Check coverage** with `pnpm run test:coverage`

Target: **>80% code coverage** for critical paths
