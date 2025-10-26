/**
 * E2E Test Suite for ZigNet MCP Server Integration
 * 
 * Tests all 4 MCP tools:
 * 1. analyze_zig - Deterministic Zig compiler validation
 * 2. compile_zig - Deterministic zig fmt formatting
 * 3. get_zig_docs - LLM-powered documentation lookup
 * 4. suggest_fix - LLM-powered error fix suggestions
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { analyzeZig } from '../../src/tools/analyze.js';
import { compileZig } from '../../src/tools/compile.js';
import { MODEL_AUTO_DOWNLOAD, MODEL_PATH } from '../../src/config.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

// Conditional imports for LLM tools (only if model available)
let getZigDocs: any;
let suggestFix: any;
let getLLM: any;
let disposeLLM: any;
let hasLLM = false;

describe('ZigNet MCP E2E Integration Tests', () => {
    const TEST_TIMEOUT = 120000; // 2 minutes for LLM operations

    beforeAll(async () => {
        // Check if model is available
        const modelPath = MODEL_PATH || join(homedir(), '.zignet', 'models', 'zignet-qwen-7b-q4km.gguf');
        hasLLM = existsSync(modelPath);

        if (hasLLM) {
            console.log('✅ LLM model found, running full test suite');
            // Dynamically import LLM modules only if model is present
            const docsModule = await import('../../src/tools/docs.js');
            const suggestModule = await import('../../src/tools/suggest.js');
            const sessionModule = await import('../../src/llm/session.js');

            getZigDocs = docsModule.getZigDocs;
            suggestFix = suggestModule.suggestFix;
            getLLM = sessionModule.getLLM;
            disposeLLM = sessionModule.disposeLLM;
        } else {
            console.log('⚠️  LLM model not found, skipping LLM tests');
            console.log(`   Expected at: ${modelPath}`);
            if (MODEL_AUTO_DOWNLOAD) {
                console.log('   Set ZIGNET_MODEL_AUTO_DOWNLOAD=false to skip auto-download');
            }
        }
    }, TEST_TIMEOUT);

    afterAll(async () => {
        // Clean up LLM resources if initialized
        if (hasLLM && disposeLLM) {
            await disposeLLM();
        }
    });

    describe('Tool 1: analyze_zig (Deterministic)', () => {
        it('should validate correct Zig code', async () => {
            const validCode = `
const std = @import("std");

pub fn add(a: i32, b: i32) i32 {
    return a + b;
}
`;
            const result = await analyzeZig({ code: validCode });

            expect(result.success).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.summary).toBeDefined();
        });

        it('should detect syntax errors', async () => {
            const invalidCode = `
pub fn broken(a: i32 {
    return a;
}
`;
            const result = await analyzeZig({ code: invalidCode });

            expect(result.success).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            // Error message might be "expected ','" or contain "error" - just check it exists
            expect(result.errors[0].message).toBeDefined();
            expect(result.errors[0].message.length).toBeGreaterThan(0);
        });

        it('should detect type mismatches', async () => {
            const typeErrorCode = `
pub fn typeError() void {
    var x: i32 = "string";
}
`;
            const result = await analyzeZig({ code: typeErrorCode });

            expect(result.success).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should handle comptime expressions', async () => {
            const comptimeCode = `
pub fn comptimeExample() void {
    const x: i32 = comptime 5;
    const y = comptime x * 2;
    _ = y;
}
`;
            const result = await analyzeZig({ code: comptimeCode });

            expect(result.success).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });

    describe('Tool 2: compile_zig (Deterministic)', () => {
        it('should format simple function', async () => {
            const unformattedCode = `pub fn add(a:i32,b:i32)i32{return a+b;}`;
            const result = await compileZig({ code: unformattedCode });

            expect(result.success).toBe(true);
            expect(result.output).toBeDefined();
            expect(result.output).toContain('pub fn add');
            expect(result.output).toContain('i32');
        });

        it('should preserve semantics after formatting', async () => {
            const code = `
const std = @import("std");
pub fn main() void {
    const x=1+2;
    const y   =   3   +   4;
    _ = x;
    _ = y;
}
`;
            const result = await compileZig({ code });

            expect(result.success).toBe(true);
            expect(result.output).toContain('const x');
            expect(result.output).toContain('const y');
        });

        it('should handle struct definitions', async () => {
            const structCode = `
pub const Point = struct {
    x: f32,
    y: f32,
    
    pub fn init(x: f32, y: f32) Point {
        return Point{ .x = x, .y = y };
    }
};
`;
            const result = await compileZig({ code: structCode });

            expect(result.success).toBe(true);
            expect(result.output).toContain('Point');
            expect(result.output).toContain('init');
        });
    });

    describe('Tool 3: get_zig_docs (LLM-Powered)', () => {
        it('should retrieve documentation for basic topics', async () => {
            if (!hasLLM) {
                console.log('   ⏭️  Skipping LLM test (model not available)');
                return;
            }

            const result = await getZigDocs({ topic: 'variables', detail_level: 'basic' });

            expect(result.topic).toBe('variables');
            expect(result.documentation).toBeDefined();
            expect(result.documentation.length).toBeGreaterThan(50);
            expect(result.examples).toBeDefined();
        }, TEST_TIMEOUT);

        it('should retrieve documentation for intermediate topics', async () => {
            if (!hasLLM) return;

            const result = await getZigDocs({ topic: 'error handling', detail_level: 'intermediate' });

            expect(result.topic).toBe('error handling');
            expect(result.documentation).toBeDefined();
            expect(result.documentation).toMatch(/error/i);
            expect(result.examples).toBeDefined();
        }, TEST_TIMEOUT);

        it('should retrieve documentation for advanced topics', async () => {
            if (!hasLLM) return;

            const result = await getZigDocs({ topic: 'comptime', detail_level: 'advanced' });

            expect(result.topic).toBe('comptime');
            expect(result.documentation).toBeDefined();
            expect(result.documentation).toMatch(/comptime/i);
            expect(result.examples).toBeDefined();
            if (result.examples) {
                expect(result.examples.length).toBeGreaterThan(0);
            }
        }, TEST_TIMEOUT);

        it('should handle memory management topics', async () => {
            if (!hasLLM) return;

            const result = await getZigDocs({ topic: 'allocators', detail_level: 'intermediate' });

            expect(result.topic).toBe('allocators');
            expect(result.documentation).toBeDefined();
            expect(result.examples).toBeDefined();
        }, TEST_TIMEOUT);

        it('should handle generic types topics', async () => {
            if (!hasLLM) return;

            const result = await getZigDocs({ topic: 'generics', detail_level: 'advanced' });

            expect(result.topic).toBe('generics');
            expect(result.documentation).toBeDefined();
            expect(result.examples).toBeDefined();
        }, TEST_TIMEOUT);
    });

    describe('Tool 4: suggest_fix (LLM-Powered)', () => {
        it('should suggest fixes for type errors', async () => {
            if (!hasLLM) return;

            const errorMsg = 'expected type \'i32\', found \'[]const u8\'';
            const codeContext = `
var x: i32 = "hello";
`;

            const result = await suggestFix({
                error_message: errorMsg,
                code_context: codeContext,
                error_type: 'type'
            });

            expect(result.error_summary).toBeDefined();
            expect(result.suggested_fixes).toBeDefined();
            expect(result.suggested_fixes.length).toBeGreaterThan(0);
            expect(result.suggested_fixes[0].description).toBeDefined();
            expect(result.suggested_fixes[0].code_after).toBeDefined();
            expect(result.suggested_fixes[0].rationale).toBeDefined();
        }, TEST_TIMEOUT);

        it('should suggest fixes for syntax errors', async () => {
            if (!hasLLM) return;

            const errorMsg = 'expected \')\', found \'{\'';
            const codeContext = `
pub fn broken(a: i32 {
    return a;
}
`;

            const result = await suggestFix({
                error_message: errorMsg,
                code_context: codeContext,
                error_type: 'syntax'
            });

            expect(result.error_summary).toBeDefined();
            expect(result.suggested_fixes).toBeDefined();
            expect(result.suggested_fixes.length).toBeGreaterThan(0);
        }, TEST_TIMEOUT);

        it('should suggest fixes for undefined variables', async () => {
            if (!hasLLM) return;

            const errorMsg = 'use of undeclared identifier \'y\'';
            const codeContext = `
pub fn example() void {
    const x = 5;
    const z = y + x;
    _ = z;
}
`;

            const result = await suggestFix({
                error_message: errorMsg,
                code_context: codeContext,
                error_type: 'semantic'
            });

            expect(result.error_summary).toBeDefined();
            expect(result.suggested_fixes).toBeDefined();
            expect(result.suggested_fixes.length).toBeGreaterThan(0);
            expect(result.explanation).toBeDefined();
        }, TEST_TIMEOUT);

        it('should suggest fixes for error set issues', async () => {
            if (!hasLLM) return;

            const errorMsg = 'error set \'error{OutOfMemory}\' is not compatible with return type';
            const codeContext = `
pub fn allocate() !void {
    return error.OutOfMemory;
}
`;

            const result = await suggestFix({
                error_message: errorMsg,
                code_context: codeContext,
                error_type: 'type'
            });

            expect(result.error_summary).toBeDefined();
            expect(result.suggested_fixes).toBeDefined();
            expect(result.suggested_fixes.length).toBeGreaterThan(0);
        }, TEST_TIMEOUT);

        it('should provide multiple fix suggestions when applicable', async () => {
            if (!hasLLM) return;

            const errorMsg = 'expected type \'i32\', found \'[]const u8\'';
            const codeContext = `
var num: i32 = "42";
`;

            const result = await suggestFix({
                error_message: errorMsg,
                code_context: codeContext,
                error_type: 'type'
            });

            expect(result.suggested_fixes).toBeDefined();
            // Should suggest multiple approaches (change type, parse string, etc.)
            expect(result.suggested_fixes.length).toBeGreaterThanOrEqual(1);

            // Check that suggestions are different
            if (result.suggested_fixes.length > 1) {
                const descriptions = result.suggested_fixes.map((fix: any) => fix.description);
                const uniqueDescriptions = new Set(descriptions);
                expect(uniqueDescriptions.size).toBe(descriptions.length);
            }
        }, TEST_TIMEOUT);
    });

    describe('Integration: Combined Tool Usage', () => {
        it('should analyze error, then suggest fix', async () => {
            if (!hasLLM) return;

            const buggyCode = `
pub fn example() void {
    var x: i32 = "not a number";
}
`;

            // Step 1: Analyze to find errors
            const analysisResult = await analyzeZig({ code: buggyCode });
            expect(analysisResult.success).toBe(false);
            expect(analysisResult.errors.length).toBeGreaterThan(0);

            // Step 2: Get fix suggestions
            const errorMsg = analysisResult.errors[0].message;
            const fixResult = await suggestFix({
                error_message: errorMsg,
                code_context: buggyCode,
                error_type: 'type'
            });

            expect(fixResult.suggested_fixes).toBeDefined();
            expect(fixResult.suggested_fixes.length).toBeGreaterThan(0);
        }, TEST_TIMEOUT);

        it('should validate fix, then format', async () => {
            const fixedCode = `
pub fn example() void {
    const x: i32 = 42;
    _ = x;
}
`;

            // Step 1: Validate the fix
            const analysisResult = await analyzeZig({ code: fixedCode });
            expect(analysisResult.success).toBe(true);

            // Step 2: Format the code
            const compileResult = await compileZig({ code: fixedCode });
            expect(compileResult.success).toBe(true);
            expect(compileResult.output).toBeDefined();
        }, TEST_TIMEOUT);

        it('should get docs for comptime, then validate comptime code', async () => {
            if (!hasLLM) return;

            // Step 1: Get documentation
            const docsResult = await getZigDocs({ topic: 'comptime', detail_level: 'intermediate' });
            expect(docsResult.documentation).toBeDefined();
            expect(docsResult.examples).toBeDefined();

            // Step 2: Validate example comptime code
            const comptimeCode = `
const std = @import("std");

pub fn comptimeSquare(comptime x: i32) i32 {
    return x * x;
}

pub fn main() void {
    const result = comptimeSquare(5);
    _ = result;
}
`;
            const analysisResult = await analyzeZig({ code: comptimeCode });
            expect(analysisResult.success).toBe(true);
        }, TEST_TIMEOUT);
    });

    describe('Performance & Resource Management', () => {
        it('should handle multiple sequential LLM queries', async () => {
            if (!hasLLM) return;

            const topics = ['structs', 'enums', 'unions'];

            for (const topic of topics) {
                const result = await getZigDocs({ topic, detail_level: 'basic' });
                expect(result.documentation).toBeDefined();
                expect(result.topic).toBe(topic);
            }
        }, TEST_TIMEOUT * 3);

        it('should clean up LLM resources properly', async () => {
            if (!hasLLM) return;

            // Get LLM instance
            const llm = await getLLM();
            expect(llm).toBeDefined();

            // Dispose and verify cleanup
            await disposeLLM();

            // Should be able to reinitialize
            const newLlm = await getLLM();
            expect(newLlm).toBeDefined();
        }, TEST_TIMEOUT);

        it('should handle concurrent analyze operations', async () => {
            const codes = [
                'pub fn test1() void {}',
                'pub fn test2() i32 { return 42; }',
                'pub fn test3(x: i32) i32 { return x * 2; }',
            ];

            const results = await Promise.all(
                codes.map(code => analyzeZig({ code }))
            );

            expect(results).toHaveLength(3);
            results.forEach(result => {
                expect(result.success).toBe(true);
            });
        });
    });

    describe('Error Handling & Edge Cases', () => {
        it('should handle empty code gracefully', async () => {
            const result = await analyzeZig({ code: '' });
            expect(result).toBeDefined();
        });

        it('should handle very long code', async () => {
            // Generate large but valid code
            let longCode = 'const std = @import("std");\n\n';
            for (let i = 0; i < 100; i++) {
                longCode += `pub fn func${i}() void {}\n`;
            }

            const result = await analyzeZig({ code: longCode });
            expect(result.success).toBe(true);
        });

        it('should handle invalid LLM topics gracefully', async () => {
            if (!hasLLM) return;

            const result = await getZigDocs({ topic: 'xxxxinvalidxxxxxx', detail_level: 'basic' });

            // Should still return a response (even if saying "not found")
            expect(result.documentation).toBeDefined();
            expect(result.topic).toBe('xxxxinvalidxxxxxx');
        }, TEST_TIMEOUT);

        it('should handle malformed error messages in suggest_fix', async () => {
            if (!hasLLM) return;

            const result = await suggestFix({
                error_message: 'completely random gibberish error message',
                code_context: 'var x = 1;',
                error_type: 'semantic'
            });

            expect(result.error_summary).toBeDefined();
            expect(result.explanation).toBeDefined();
        }, TEST_TIMEOUT);
    });
});
