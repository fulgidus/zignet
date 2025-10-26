/**
 * Zig Executor
 *
 * Executes Zig compiler commands (ast-check, fmt, etc.) with specific versions.
 * Parses compiler output and formats errors for MCP responses.
 */

import { execSync } from "child_process";
import { writeFileSync, unlinkSync, mkdtempSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { ensureZig, type ZigVersion } from "./manager.js";
import { DEFAULT_ZIG_VERSION } from "../config.js";

/**
 * Zig compiler error/warning
 */
export interface ZigDiagnostic {
    message: string;
    file?: string;
    line?: number;
    column?: number;
    severity: "error" | "warning" | "note";
}

/**
 * Result from Zig execution
 */
export interface ZigResult {
    success: boolean;
    output: string;
    diagnostics: ZigDiagnostic[];
}

/**
 * Parse Zig compiler output to extract diagnostics
 *
 * Zig error format:
 * /tmp/file.zig:2:5: error: expected type 'i32', found '[]const u8'
 *     return "hello";
 *     ^~~~~~~~~~~~~~
 */
function parseZigOutput(output: string): ZigDiagnostic[] {
    const diagnostics: ZigDiagnostic[] = [];
    const lines = output.split("\n");

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Match Zig error format: file:line:col: severity: message
        const match = line.match(
            /^(.+?):(\d+):(\d+):\s+(error|warning|note):\s+(.+)$/,
        );

        if (match) {
            const [, file, lineNum, colNum, severity, message] = match;
            diagnostics.push({
                message: message.trim(),
                file,
                line: parseInt(lineNum, 10),
                column: parseInt(colNum, 10),
                severity: severity as "error" | "warning" | "note",
            });
        } else if (line.trim().startsWith("error:")) {
            // Generic error without location
            diagnostics.push({
                message: line.replace(/^error:\s+/, "").trim(),
                severity: "error",
            });
        }
    }

    return diagnostics;
}

/**
 * Execute Zig AST check on code
 *
 * @param code - Zig source code to check
 * @param version - Zig version to use (default: from ZIG_DEFAULT env var)
 * @returns Result with success status and diagnostics
 */
export function zigAstCheck(
    code: string,
    version: ZigVersion = DEFAULT_ZIG_VERSION,
): ZigResult {
    // Ensure Zig version is installed
    const zigBinary = ensureZig(version);

    // Create temporary file
    const tempDir = mkdtempSync(join(tmpdir(), "zignet-"));
    const tempFile = join(tempDir, "check.zig");

    try {
        // Write code to temp file
        writeFileSync(tempFile, code, "utf8");

        // Run zig ast-check
        try {
            const output = execSync(`"${zigBinary}" ast-check "${tempFile}"`, {
                encoding: "utf8",
                stdio: "pipe",
            });

            return {
                success: true,
                output: output.trim(),
                diagnostics: [],
            };
        } catch (error: unknown) {
            // ast-check failed, parse errors
            const errorObj = error as { stderr?: Buffer; stdout?: Buffer };
            const stderr = (
                errorObj.stderr ??
                errorObj.stdout ??
                Buffer.from("")
            ).toString();
            const diagnostics = parseZigOutput(stderr);

            return {
                success: false,
                output: stderr.trim(),
                diagnostics,
            };
        }
    } finally {
        // Cleanup
        try {
            unlinkSync(tempFile);
        } catch {
            // Ignore cleanup errors
        }
    }
}

/**
 * Execute Zig format on code
 *
 * @param code - Zig source code to format
 * @param version - Zig version to use (default: from ZIG_DEFAULT env var)
 * @returns Formatted code or error
 */
export function zigFormat(
    code: string,
    version: ZigVersion = DEFAULT_ZIG_VERSION,
): ZigResult {
    // Ensure Zig version is installed
    const zigBinary = ensureZig(version);

    // Create temporary file
    const tempDir = mkdtempSync(join(tmpdir(), "zignet-"));
    const tempFile = join(tempDir, "format.zig");

    try {
        // Write code to temp file
        writeFileSync(tempFile, code, "utf8");

        // Run zig fmt --check (check if formatting needed)
        try {
            execSync(`"${zigBinary}" fmt --check "${tempFile}"`, {
                encoding: "utf8",
                stdio: "pipe",
            });

            // No formatting needed, return original
            return {
                success: true,
                output: code,
                diagnostics: [],
            };
        } catch {
            // Formatting needed or error occurred
            // Try to format
            try {
                execSync(`"${zigBinary}" fmt "${tempFile}"`, {
                    stdio: "pipe",
                });

                // Read formatted code
                const formatted = readFileSync(tempFile, "utf8");

                return {
                    success: true,
                    output: formatted,
                    diagnostics: [],
                };
            } catch (fmtError: unknown) {
                // Format failed, parse errors
                const errorObj = fmtError as {
                    stderr?: Buffer;
                    stdout?: Buffer;
                };
                const stderr = (
                    errorObj.stderr ??
                    errorObj.stdout ??
                    Buffer.from("")
                ).toString();
                const diagnostics = parseZigOutput(stderr);

                return {
                    success: false,
                    output: stderr.trim(),
                    diagnostics,
                };
            }
        }
    } finally {
        // Cleanup
        try {
            unlinkSync(tempFile);
        } catch {
            // Ignore cleanup errors
        }
    }
}

/**
 * Get Zig version string
 *
 * @param version - Zig version to check
 * @returns Version string (e.g., "0.15.0")
 */
export function getZigVersionString(version: ZigVersion): string {
    const zigBinary = ensureZig(version);

    try {
        const output = execSync(`"${zigBinary}" version`, {
            encoding: "utf8",
            stdio: "pipe",
        });

        return output.trim();
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to get Zig version: ${message}`);
    }
}
