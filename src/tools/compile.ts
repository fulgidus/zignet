/**
 * compile_zig tool implementation
 *
 * Formats Zig code using the official Zig compiler.
 * Supports multiple Zig versions for consistent formatting.
 */

import { zigFormat } from "../zig/executor.js";
import { type ZigVersion } from "../zig/manager.js";
import { DEFAULT_ZIG_VERSION } from "../config.js";

export interface CompileInput {
    code: string;
    zig_version?: ZigVersion;
}

export interface CompileResult {
    success: boolean;
    output?: string;
    errors: Array<{
        message: string;
        line?: number;
        column?: number;
        severity: "error" | "warning";
    }>;
    summary: string;
    zig_version: string;
}

/**
 * Format Zig code using official Zig formatter
 */
export async function compileZig(input: CompileInput): Promise<CompileResult> {
    const { code, zig_version = DEFAULT_ZIG_VERSION } = input;

    // Validate input
    if (!code || code.trim().length === 0) {
        return {
            success: false,
            errors: [
                { message: "Input code cannot be empty", severity: "error" },
            ],
            summary: "❌ Empty input",
            zig_version,
        };
    }

    try {
        // Run Zig fmt (wrapped in Promise for consistent async API)
        const result = await Promise.resolve(zigFormat(code, zig_version));

        if (result.success) {
            return {
                success: true,
                output: result.output,
                errors: [],
                summary: `✅ Formatted successfully (Zig ${zig_version})`,
                zig_version,
            };
        } else {
            // Format failed
            const errors = result.diagnostics.map((d) => ({
                message: d.message,
                line: d.line,
                column: d.column,
                severity: "error" as const,
            }));

            return {
                success: false,
                errors,
                summary: `❌ Format failed (Zig ${zig_version})`,
                zig_version,
            };
        }
    } catch (error) {
        return {
            success: false,
            errors: [
                {
                    message: `Failed to run Zig formatter: ${error instanceof Error ? error.message : String(error)}`,
                    severity: "error",
                },
            ],
            summary: `❌ Format failed: Could not execute Zig ${zig_version}`,
            zig_version,
        };
    }
}

/**
 * Format compile result for MCP response
 */
export function formatCompileResult(result: CompileResult): string {
    const lines: string[] = [];

    lines.push(result.summary);
    lines.push("");

    if (result.success && result.output) {
        lines.push("**Formatted Zig Code:**");
        lines.push("```zig");
        lines.push(result.output);
        lines.push("```");
        return lines.join("\n");
    }

    if (result.errors.length > 0) {
        lines.push("**Errors:**");
        result.errors.forEach((error, index) => {
            const location =
                error.line && error.column
                    ? ` (${error.line}:${error.column})`
                    : "";
            lines.push(`${index + 1}. ${error.message}${location}`);
        });
    }

    return lines.join("\n");
}
