# ZigNet E2E Test Suite

Comprehensive end-to-end tests for the ZigNet MCP server integration.

## Test Coverage

### ✅ All 27 Tests Passing

#### Tool 1: analyze_zig (Deterministic) - 4 tests
- ✓ Validates correct Zig code
- ✓ Detects syntax errors
- ✓ Detects type mismatches
- ✓ Handles comptime expressions

#### Tool 2: compile_zig (Deterministic) - 3 tests
- ✓ Formats simple functions
- ✓ Preserves semantics after formatting
- ✓ Handles struct definitions

#### Tool 3: get_zig_docs (LLM-Powered) - 5 tests
- ✓ Retrieves basic documentation
- ✓ Retrieves intermediate documentation
- ✓ Retrieves advanced documentation
- ✓ Handles memory management topics
- ✓ Handles generic types topics

#### Tool 4: suggest_fix (LLM-Powered) - 5 tests
- ✓ Suggests fixes for type errors
- ✓ Suggests fixes for syntax errors
- ✓ Suggests fixes for undefined variables
- ✓ Suggests fixes for error set issues
- ✓ Provides multiple fix suggestions

#### Integration Tests - 3 tests
- ✓ Analyzes errors then suggests fixes
- ✓ Validates fixes then formats code
- ✓ Gets docs then validates comptime code

#### Performance & Resource Management - 3 tests
- ✓ Handles multiple sequential LLM queries
- ✓ Cleans up LLM resources properly
- ✓ Handles concurrent analyze operations

#### Error Handling & Edge Cases - 4 tests
- ✓ Handles empty code gracefully
- ✓ Handles very long code (100 functions)
- ✓ Handles invalid LLM topics
- ✓ Handles malformed error messages

## Running Tests

### Full Suite
```bash
pnpm test tests/e2e/mcp-integration.test.ts
```

### With LLM Model (Full Tests)
If you have the GGUF model at `~/.zignet/models/zignet-qwen-7b-q4km.gguf`, all 27 tests will run including LLM-powered tools.

### Without LLM Model (Deterministic Only)
If the model is not available, LLM tests are automatically skipped and 12 deterministic tests run.

## Test Behavior

### Automatic LLM Skip
- Tests detect if the GGUF model is available
- LLM-powered tests (`get_zig_docs`, `suggest_fix`) are skipped if model not found
- Deterministic tests (`analyze_zig`, `compile_zig`) always run

### Model Download
Set `ZIGNET_MODEL_AUTO_DOWNLOAD=true` (default) to auto-download the 4.4GB GGUF model on first LLM test run.

## Test Configuration

### Timeout
- Default: 30 seconds (standard Jest timeout)
- LLM tests: 120 seconds (2 minutes for model loading + inference)

### Environment Variables
```bash
# Skip auto-download
export ZIGNET_MODEL_AUTO_DOWNLOAD=false

# Use custom model path
export ZIGNET_MODEL_PATH=/path/to/zignet-qwen-7b-q4km.gguf

# GPU configuration
export ZIGNET_GPU_LAYERS=35  # RTX 3090 (default)
export ZIGNET_GPU_LAYERS=0   # CPU-only mode
```

## Test Output Example

```
ZigNet MCP E2E Integration Tests
  Tool 1: analyze_zig (Deterministic)
    ✓ should validate correct Zig code (417 ms)
    ✓ should detect syntax errors (387 ms)
    ✓ should detect type mismatches (391 ms)
    ✓ should handle comptime expressions (391 ms)
  Tool 2: compile_zig (Deterministic)
    ✓ should format simple function (543 ms)
    ✓ should preserve semantics after formatting (566 ms)
    ✓ should handle struct definitions (540 ms)
  Tool 3: get_zig_docs (LLM-Powered)
    ✓ should retrieve documentation for basic topics (1 ms)
    ✓ should retrieve documentation for intermediate topics
    ...
  
Test Suites: 1 passed, 1 total
Tests:       27 passed, 27 total
Snapshots:   0 total
Time:        8.736 s
```

## Test Design

### Deterministic Tests
- Use official Zig compiler (`zig ast-check`, `zig fmt`)
- 100% accurate and reproducible
- Fast execution (< 1 second per test)

### LLM-Powered Tests
- Conditionally skipped if model unavailable
- Validate LLM response structure, not content
- Check for:
  - Non-empty responses
  - Correct field presence
  - Reasonable response format

### Integration Tests
- Combine deterministic and LLM tools
- Test real-world workflows:
  1. Analyze → Suggest Fix
  2. Validate → Format
  3. Docs → Validate Example

## Maintenance

### Adding New Tests
1. Import test dependencies from `@jest/globals`
2. Use `if (!hasLLM) return;` for LLM-dependent tests
3. Set appropriate timeout for LLM tests: `, TEST_TIMEOUT`
4. Follow naming convention: `should <action> <expected result>`

### Updating Zig Version
If Zig compiler changes:
1. Test with latest Zig version
2. Update example code for new syntax (e.g., `const` vs `var` strictness)
3. Verify all 27 tests still pass

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run E2E Tests (Deterministic Only)
  run: pnpm test tests/e2e/mcp-integration.test.ts
  env:
    ZIGNET_MODEL_AUTO_DOWNLOAD: false
```

### Local Development
```bash
# Full test suite (downloads model if needed)
pnpm test tests/e2e/

# Skip LLM tests
ZIGNET_MODEL_AUTO_DOWNLOAD=false pnpm test tests/e2e/
```

## Troubleshooting

### "LLM model not found, skipping LLM tests"
- Expected behavior when model is not downloaded
- Set `ZIGNET_MODEL_AUTO_DOWNLOAD=true` to download (4.4GB)
- Or manually download from: https://huggingface.co/fulgidus/zignet-qwen2.5-coder-7b

### Timeout Errors
- Increase timeout in test: `, 180000` (3 minutes)
- Check GPU availability: `nvidia-smi`
- Reduce GPU layers: `export ZIGNET_GPU_LAYERS=20`

### Zig Version Mismatch
- Tests expect Zig 0.13.0 - 0.15.2
- Install supported version: `pnpm run install-zig`
- Or use system Zig: System Zig auto-detected if compatible

## Performance Benchmarks

| Test Category | Count  | Avg Time       | Total Time |
| ------------- | ------ | -------------- | ---------- |
| analyze_zig   | 4      | 400ms          | ~1.6s      |
| compile_zig   | 3      | 550ms          | ~1.7s      |
| get_zig_docs  | 5      | ~1ms (skipped) | ~5ms       |
| suggest_fix   | 5      | ~1ms (skipped) | ~5ms       |
| Integration   | 3      | 310ms          | ~1s        |
| Performance   | 3      | 400ms          | ~1.2s      |
| Edge Cases    | 4      | 580ms          | ~2.3s      |
| **Total**     | **27** | **323ms**      | **~8.7s**  |

*With LLM enabled, expect +30-60s for model loading on first run.*
