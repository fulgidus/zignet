/**
 * E2E Tests for Zig Tools (analyze_zig, compile_zig)
 *
 * Tests actual Zig compiler integration without LLM
 */

import { describe, it, expect } from 'vitest';
import { analyzeZig } from '../../src/tools/analyze.js';
import { compileZig } from '../../src/tools/compile.js';

describe('Zig Tools E2E', () => {
    describe('analyze_zig', () => {
        it('should analyze valid Zig code', async () => {
            const code = `
fn main() void {
    const x: i32 = 42;
    const y: i32 = x + 10;
    _ = y; // Use variable to avoid unused error in Zig 0.15.1+
}
            `.trim();

            const result = await analyzeZig({ code });

            expect(result.success).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.warnings).toHaveLength(0);
            expect(result.summary).toContain('✅');
        });

        it('should detect syntax errors', async () => {
            const code = `
fn main() void {
    const x: i32 = "not a number";
}
            `.trim();

            const result = await analyzeZig({ code });

            expect(result.success).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.summary).toContain('❌');
        });

        it('should detect type errors', async () => {
            const code = `
fn add(a: i32, b: i32) i32 {
    return "string";
}
            `.trim();

            const result = await analyzeZig({ code });

            expect(result.success).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should handle empty code', async () => {
            const result = await analyzeZig({ code: '' });

            expect(result.success).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should work with different Zig versions', async () => {
            const code = 'fn main() void {}';

            // Test with explicit version (if installed)
            const result = await analyzeZig({
                code,
                zig_version: '0.14.0',
            });

            expect(result.zig_version).toBe('0.14.0');
        }, 120000);
    });

    describe('compile_zig', () => {
        it('should format valid Zig code', async () => {
            const code = 'fn add(a:i32,b:i32)i32{return a+b;}';

            const result = await compileZig({ code });

            expect(result.success).toBe(true);
            expect(result.output).toBeDefined();
            expect(result.output).toContain('fn add(a: i32, b: i32) i32');
            expect(result.output).toContain('return a + b;');
        });

        it('should reject invalid code', async () => {
            const code = 'this is not valid zig code!!!';

            const result = await compileZig({ code });

            expect(result.success).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should handle empty code', async () => {
            const result = await compileZig({ code: '' });

            expect(result.success).toBe(false);
            expect(result.summary).toContain('Empty input');
        });

        it('should preserve semantics while formatting', async () => {
            const code = `
fn factorial(n: u32) u32 {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}
            `.trim();

            const result = await compileZig({ code });

            expect(result.success).toBe(true);
            expect(result.output).toContain('factorial');
            expect(result.output).toContain('return');
        });
    });

    describe('Cross-tool Integration', () => {
        it('should analyze then compile valid code', async () => {
            const code = 'fn myFunc() void { const x: i32 = 42; _ = x; }';

            // First analyze
            const analyzeResult = await analyzeZig({ code });
            expect(analyzeResult.success).toBe(true);

            // Then compile/format
            const compileResult = await compileZig({ code });
            expect(compileResult.success).toBe(true);
            expect(compileResult.output).toBeDefined();
        });

        it('should fail compile if analysis fails', async () => {
            const code = 'invalid zig code';

            const analyzeResult = await analyzeZig({ code });
            expect(analyzeResult.success).toBe(false);

            const compileResult = await compileZig({ code });
            expect(compileResult.success).toBe(false);
        });
    });
});
