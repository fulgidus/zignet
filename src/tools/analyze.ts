/**
 * analyze_zig tool implementation
 * 
 * Analyzes Zig code using:
 * - Lexer: Tokenization
 * - Parser: AST generation
 * - TypeChecker: Type validation
 */

import { Lexer } from "../lexer.js";
import { Parser } from "../parser.js";
import { TypeChecker } from "../type-checker.js";

export interface AnalyzeZigInput {
    code: string;
}

export interface AnalyzeZigResult {
    success: boolean;
    errors: Array<{
        message: string;
        line?: number;
        column?: number;
        severity: "error" | "warning";
    }>;
    warnings: Array<{
        message: string;
        line?: number;
        column?: number;
    }>;
    summary: string;
}

/**
 * Analyze Zig code for syntax and type errors
 */
export async function analyzeZig(input: AnalyzeZigInput): Promise<AnalyzeZigResult> {
    const { code } = input;

    const result: AnalyzeZigResult = {
        success: true,
        errors: [],
        warnings: [],
        summary: "",
    };

    try {
        // Step 1: Lexical Analysis
        const lexer = new Lexer(code);
        let tokens;

        try {
            tokens = lexer.tokenize();
        } catch (error) {
            result.success = false;
            result.errors.push({
                message: `Lexical error: ${error instanceof Error ? error.message : String(error)}`,
                severity: "error",
            });
            result.summary = "❌ Lexical analysis failed";
            return result;
        }

        // Step 2: Syntax Analysis (Parsing)
        const parser = new Parser(tokens);
        let ast;

        try {
            ast = parser.parse();
        } catch (error) {
            result.success = false;
            const errorMsg = error instanceof Error ? error.message : String(error);

            // Try to extract line/column from parser error
            const match = errorMsg.match(/at line (\d+), column (\d+)/);
            const line = match ? parseInt(match[1]) : undefined;
            const column = match ? parseInt(match[2]) : undefined;

            result.errors.push({
                message: `Syntax error: ${errorMsg}`,
                line,
                column,
                severity: "error",
            });
            result.summary = "❌ Syntax analysis failed";
            return result;
        }

        // Step 3: Semantic Analysis (Type Checking)
        const typeChecker = new TypeChecker();

        try {
            typeChecker.check(ast);

            // Check for type errors
            const typeErrors = typeChecker.getErrors();

            if (typeErrors.length > 0) {
                result.success = false;
                result.errors.push(
                    ...typeErrors.map((err) => ({
                        message: err.message,
                        line: err.line,
                        column: err.column,
                        severity: "error" as const,
                    }))
                );
            }

            // Note: TypeChecker currently doesn't track warnings separately
            // This can be added in the future if needed
        } catch (error) {
            result.success = false;
            result.errors.push({
                message: `Type checking error: ${error instanceof Error ? error.message : String(error)}`,
                severity: "error",
            });
            result.summary = "❌ Type checking failed";
            return result;
        }

        // Generate summary
        if (result.success) {
            result.summary = `✅ Analysis Result:
- Syntax: Valid
- Type Check: PASS
- Warnings: ${result.warnings.length}
- Errors: 0`;
        } else {
            result.summary = `❌ Analysis Result:
- Syntax: ${result.errors.some(e => e.message.includes('Syntax')) ? 'Invalid' : 'Valid'}
- Type Check: FAIL
- Warnings: ${result.warnings.length}
- Errors: ${result.errors.length}`;
        }

        return result;
    } catch (error) {
        // Unexpected error
        result.success = false;
        result.errors.push({
            message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
            severity: "error",
        });
        result.summary = "❌ Analysis failed with unexpected error";
        return result;
    }
}

/**
 * Format analysis result for MCP response
 */
export function formatAnalyzeResult(result: AnalyzeZigResult): string {
    let output = result.summary + "\n\n";

    if (result.errors.length > 0) {
        output += "🔴 Errors:\n";
        result.errors.forEach((error, index) => {
            const location = error.line ? ` (line ${error.line}${error.column ? `, col ${error.column}` : ''})` : '';
            output += `${index + 1}. ${error.message}${location}\n`;
        });
        output += "\n";
    }

    if (result.warnings.length > 0) {
        output += "⚠️  Warnings:\n";
        result.warnings.forEach((warning, index) => {
            const location = warning.line ? ` (line ${warning.line}${warning.column ? `, col ${warning.column}` : ''})` : '';
            output += `${index + 1}. ${warning.message}${location}\n`;
        });
    }

    return output.trim();
}
