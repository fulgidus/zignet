/**
 * analyze_zig tool implementation
 *
 * Analyzes Zig code using the official Zig compiler.
 * Supports multiple Zig versions for accurate validation.
 */

import { zigAstCheck } from '../zig/executor.js';
import { type ZigVersion } from '../zig/manager.js';
import { DEFAULT_ZIG_VERSION } from '../config.js';

export interface AnalyzeZigInput {
    code: string;
    zig_version?: ZigVersion;
}

export interface AnalyzeZigResult {
    success: boolean;
    errors: Array<{
        message: string;
        line?: number;
        column?: number;
        severity: 'error' | 'warning';
    }>;
    warnings: Array<{
        message: string;
        line?: number;
        column?: number;
    }>;
    summary: string;
    zig_version: string;
}

/**
 * Analyze Zig code using official Zig compiler
 */
export async function analyzeZig(input: AnalyzeZigInput): Promise<AnalyzeZigResult> {
    const { code, zig_version = DEFAULT_ZIG_VERSION } = input;

    // Validate input
    if (!code || code.trim().length === 0) {
        return {
            success: true,
            errors: [],
            warnings: [],
            summary: '✅ Analysis Result: Empty code (valid)',
            zig_version,
        };
    }

    try {
        // Run Zig ast-check (wrap sync call for consistent async API)
        const result = await Promise.resolve(zigAstCheck(code, zig_version));

        // Separate errors and warnings
        const errors = result.diagnostics
            .filter((d) => d.severity === 'error')
            .map((d) => ({
                message: d.message,
                line: d.line,
                column: d.column,
                severity: 'error' as const,
            }));

        const warnings = result.diagnostics
            .filter((d) => d.severity === 'warning')
            .map((d) => ({
                message: d.message,
                line: d.line,
                column: d.column,
            }));

        // Generate summary
        const summary = result.success
            ? `✅ Analysis Result (Zig ${zig_version}):
- Syntax: Valid
- Type Check: PASS
- Warnings: ${warnings.length}
- Errors: 0`
            : `❌ Analysis Result (Zig ${zig_version}):
- Syntax: ${errors.some((e) => e.message.includes('expected')) ? 'Invalid' : 'Valid'}
- Type Check: FAIL
- Warnings: ${warnings.length}
- Errors: ${errors.length}`;

        return {
            success: result.success,
            errors,
            warnings,
            summary,
            zig_version,
        };
    } catch (error) {
        // Unexpected error (e.g., Zig installation failed)
        return {
            success: false,
            errors: [
                {
                    message: `Failed to run Zig compiler: ${error instanceof Error ? error.message : String(error)}`,
                    severity: 'error',
                },
            ],
            warnings: [],
            summary: `❌ Analysis failed: Could not execute Zig ${zig_version}`,
            zig_version,
        };
    }
}

/**
 * Format analysis result for MCP response
 */
export function formatAnalyzeResult(result: AnalyzeZigResult): string {
    let output = result.summary + '\n\n';

    if (result.errors.length > 0) {
        output += '🔴 Errors:\n';
        result.errors.forEach((error, index) => {
            const location = error.line
                ? ` (line ${error.line}${error.column ? `, col ${error.column}` : ''})`
                : '';
            output += `${index + 1}. ${error.message}${location}\n`;
        });
        output += '\n';
    }

    if (result.warnings.length > 0) {
        output += '⚠️  Warnings:\n';
        result.warnings.forEach((warning, index) => {
            const location = warning.line
                ? ` (line ${warning.line}${warning.column ? `, col ${warning.column}` : ''})`
                : '';
            output += `${index + 1}. ${warning.message}${location}\n`;
        });
    }

    return output.trim();
}
