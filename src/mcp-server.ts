/**
 * ZigNet MCP Server
 * 
 * Model Context Protocol server for Zig code analysis and assistance.
 * 
 * Tools:
 * - analyze_zig: Analyze Zig code for errors and validation
 * - compile_zig: Compile and format Zig code
 * - get_zig_docs: Retrieve Zig documentation
 * - suggest_fix: Get intelligent fix suggestions
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Import tool implementations
import { analyzeZig, formatAnalyzeResult } from "./tools/analyze.js";
import { compileZig, formatCompileResult } from "./tools/compile.js";

/**
 * Create and configure the MCP server
 */
function createServer() {
    const server = new Server(
        {
            name: "zignet",
            version: "0.1.0",
        },
        {
            capabilities: {
                tools: {},
            },
        }
    );

    /**
     * Handler for listing available tools
     */
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
            tools: [
                {
                    name: "analyze_zig",
                    description:
                        "Analyze Zig code for syntax errors, type mismatches, and semantic issues",
                    inputSchema: {
                        type: "object",
                        properties: {
                            code: {
                                type: "string",
                                description: "Zig source code to analyze",
                            },
                        },
                        required: ["code"],
                    },
                },
                {
                    name: "compile_zig",
                    description: "Validate and format Zig code",
                    inputSchema: {
                        type: "object",
                        properties: {
                            code: {
                                type: "string",
                                description: "Zig source code to compile",
                            },
                        },
                        required: ["code"],
                    },
                },
                {
                    name: "get_zig_docs",
                    description: "Retrieve Zig documentation for specific topics",
                    inputSchema: {
                        type: "object",
                        properties: {
                            topic: {
                                type: "string",
                                description: "Topic to get documentation for (e.g., 'comptime', 'generics')",
                            },
                        },
                        required: ["topic"],
                    },
                },
                {
                    name: "suggest_fix",
                    description: "Get intelligent suggestions for fixing Zig code errors",
                    inputSchema: {
                        type: "object",
                        properties: {
                            error: {
                                type: "string",
                                description: "Error message to get fix suggestions for",
                            },
                            code: {
                                type: "string",
                                description: "Code context where the error occurred",
                            },
                        },
                        required: ["error", "code"],
                    },
                },
            ],
        };
    });

    /**
     * Handler for tool execution
     */
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args = {} } = request.params;

        switch (name) {
            case "analyze_zig": {
                const code = (args as { code?: string }).code;
                if (!code) {
                    throw new Error("Missing required argument: code");
                }
                const result = analyzeZig({ code });
                return {
                    content: [
                        {
                            type: "text",
                            text: formatAnalyzeResult(result),
                        },
                    ],
                };
            }

            case "compile_zig": {
                const compileArgs = args as { code?: string; output_format?: "zig" | "json" };
                if (!compileArgs.code) {
                    throw new Error("Missing required argument: code");
                }
                const result = compileZig({
                    code: compileArgs.code,
                    output_format: compileArgs.output_format || "zig"
                });
                return {
                    content: [
                        {
                            type: "text",
                            text: formatCompileResult(result),
                        },
                    ],
                };
            }

            case "get_zig_docs":
                // TODO: Implement using fine-tuned LLM
                return {
                    content: [
                        {
                            type: "text",
                            text: "⚠️ get_zig_docs tool not yet implemented\nWaiting for fine-tuned model!",
                        },
                    ],
                };

            case "suggest_fix":
                // TODO: Implement using fine-tuned LLM
                return {
                    content: [
                        {
                            type: "text",
                            text: "⚠️ suggest_fix tool not yet implemented\nWaiting for fine-tuned model!",
                        },
                    ],
                };

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    });

    return server;
}

/**
 * Main entry point
 */
async function main() {
    const server = createServer();
    const transport = new StdioServerTransport();

    await server.connect(transport);

    console.error("ZigNet MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
