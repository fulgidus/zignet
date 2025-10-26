/**
 * Manual test for MCP tools (analyze_zig and compile_zig)
 * 
 * Run with: pnpm run build && node dist/test-tools.cjs
 */

import { analyzeZig, formatAnalyzeResult } from "./tools/analyze.js";
import { compileZig, formatCompileResult } from "./tools/compile.js";

async function runTests() {
    console.log("=== ZigNet MCP Tools Manual Test ===\n");

    // Test 1: Valid Zig code (should pass all checks)
    console.log("Test 1: Valid Zig Code");
    console.log("=".repeat(50));
    const validCode = `fn add(a: i32, b: i32) i32 {
    return a + b;
}`;

    console.log("Input:");
    console.log("\n--- analyze_zig result ---");
    const analyzeResult1 = await analyzeZig({ code: validCode });
    console.log(formatAnalyzeResult(analyzeResult1));
    console.log("\n--- compile_zig result ---");
    const compileResult1 = await compileZig({ code: validCode });
    console.log(formatCompileResult(compileResult1));

    // Test 2: Syntax error (missing closing brace)
    console.log("\n\nTest 2: Syntax Error (Missing Brace)");
    console.log("=".repeat(50));
    const syntaxErrorCode = `fn multiply(x: i32, y: i32) i32 {
    return x * y;
// Missing closing brace`;

    console.log("Input:");
    console.log("\n--- analyze_zig result ---");
    const analyzeResult2 = await analyzeZig({ code: syntaxErrorCode });
    console.log(formatAnalyzeResult(analyzeResult2));

    // Test 3: Type error (wrong return type)
    console.log("\n\nTest 3: Type Error (Return Type Mismatch)");
    console.log("=".repeat(50));
    const typeErrorCode = `fn getString() i32 {
    return "hello";
}`;

    console.log("Input:");
    console.log("\n--- analyze_zig result ---");
    const analyzeResult3 = await analyzeZig({ code: typeErrorCode });
    console.log(formatAnalyzeResult(analyzeResult3));

    // Test 4: Empty code
    console.log("\n\nTest 4: Empty Code");
    console.log("=".repeat(50));
    const emptyCode = "";

    console.log("\n--- analyze_zig result ---");
    const analyzeResult4 = await analyzeZig({ code: emptyCode });
    console.log(formatAnalyzeResult(analyzeResult4));

    // Test 5: Complex valid code (struct + method)
    console.log("\n\nTest 5: Complex Valid Code (Struct)");
    console.log("=".repeat(50));
    const complexCode = `const Point = struct {
    x: i32,
    y: i32,

    pub fn init(x: i32, y: i32) Point {
        return Point{ .x = x, .y = y };
    }
};`;

    console.log("Input:");
    console.log("\n--- compile_zig result ---");
    const compileResult5 = await compileZig({ code: complexCode });
    console.log(formatCompileResult(compileResult5));
    console.log("\n=== Test Complete ===");
}

// Run the async test function
runTests().catch(console.error);
console.log("\n=== Test Complete ===");
