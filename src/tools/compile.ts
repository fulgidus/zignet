/**
 * compile_zig MCP Tool Implementation
 *
 * Purpose: Compile/format Zig code using ZigNet's compiler pipeline
 *
 * Pipeline:
 * 1. Lexer: Tokenize input code
 * 2. Parser: Build AST
 * 3. CodeGen: Generate formatted Zig code
 *
 * This tool does NOT perform type checking (use analyze_zig for that).
 * It focuses on syntax validation and code formatting.
 */

import { Lexer } from "../lexer.js";
import { Parser } from "../parser.js";
import { CodeGenerator } from "../codegen.js";

/**
 * Input for compile_zig tool
 */
export interface CompileInput {
    code: string;
    output_format?: "zig" | "json"; // Default: zig
}

/**
 * Result from compile_zig tool
 */
export interface CompileResult {
    success: boolean;
    output?: string; // Formatted Zig code
    errors: Array<{
        message: string;
        line?: number;
        column?: number;
        severity: "error" | "warning";
    }>;
    summary: string;
}

/**
 * Compile Zig code (syntax validation + formatting)
 *
 * @param input - Code to compile and formatting options
 * @returns CompileResult with formatted code or errors
 */
export function compileZig(input: CompileInput): CompileResult {
    const result: CompileResult = {
        success: false,
        errors: [],
        summary: "",
    };

    const { code, output_format = "zig" } = input;

    // Validate input
    if (!code || code.trim().length === 0) {
        result.errors.push({
            message: "Input code cannot be empty",
            severity: "error",
        });
        result.summary = "❌ Empty input";
        return result;
    }

    // Step 1: Tokenize
    let tokens;
    try {
        const lexer = new Lexer(code);
        tokens = lexer.tokenize();
    } catch (error) {
        result.errors.push({
            message: `Lexer error: ${error instanceof Error ? error.message : String(error)}`,
            severity: "error",
        });
        result.summary = "❌ Lexer failed";
        return result;
    }

    // Step 2: Parse
    let ast;
    try {
        const parser = new Parser(tokens);
        ast = parser.parse();
    } catch (error) {
        // Try to extract location from parser error
        const errorMessage = error instanceof Error ? error.message : String(error);
        const locationMatch = errorMessage.match(/at (\d+):(\d+)/);

        result.errors.push({
            message: `Parse error: ${errorMessage}`,
            line: locationMatch ? parseInt(locationMatch[1], 10) : undefined,
            column: locationMatch ? parseInt(locationMatch[2], 10) : undefined,
            severity: "error",
        });
        result.summary = "❌ Parse failed";
        return result;
    }

    // Step 3: Generate code
    try {
        const codegen = new CodeGenerator();
        const formattedCode = codegen.generate(ast);

        result.success = true;
        result.output = formattedCode;
        result.summary = "✅ Compiled successfully";

        return result;
    } catch (error) {
        result.errors.push({
            message: `Code generation error: ${error instanceof Error ? error.message : String(error)}`,
            severity: "error",
        });
        result.summary = "❌ Code generation failed";
        return result;
    }
}

/**
 * Format compile result for MCP response
 *
 * @param result - CompileResult from compileZig
 * @returns Formatted string for Claude
 */
export function formatCompileResult(result: CompileResult): string {
    const lines: string[] = [];

    // Summary
    lines.push(result.summary);
    lines.push("");

    // Success case: show formatted code
    if (result.success && result.output) {
        lines.push("**Formatted Zig Code:**");
        lines.push("```zig");
        lines.push(result.output);
        lines.push("```");
        return lines.join("\n");
    }

    // Error case: show all errors
    if (result.errors.length > 0) {
        lines.push("**Errors:**");
        result.errors.forEach((error, index) => {
            const location = error.line && error.column ? ` (${error.line}:${error.column})` : "";
            lines.push(`${index + 1}. ${error.message}${location}`);
        });
    }

    return lines.join("\n");
}
