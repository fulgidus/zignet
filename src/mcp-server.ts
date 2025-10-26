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

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Import tool implementations
import { analyzeZig, formatAnalyzeResult } from "./tools/analyze.js";
import { compileZig, formatCompileResult } from "./tools/compile.js";
import { getZigDocs } from "./tools/docs.js";
import { suggestFix } from "./tools/suggest.js";

// Import configuration
import { SUPPORTED_ZIG_VERSIONS, DEFAULT_ZIG_VERSION } from './config.js';

/**
 * Create and configure the MCP server
 */
function createServer() {
    const server = new Server(
        {
            name: 'zignet',
            version: '0.15.2-g',
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
                    name: 'analyze_zig',
                    description:
                        'Analyze Zig code for syntax errors, type mismatches, and semantic issues using the official Zig compiler',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            code: {
                                type: 'string',
                                description: 'Zig source code to analyze',
                            },
                            zig_version: {
                                type: 'string',
                                enum: SUPPORTED_ZIG_VERSIONS as unknown as string[],
                                description: `Zig version to use for validation (default: ${DEFAULT_ZIG_VERSION})`,
                            },
                        },
                        required: ['code'],
                    },
                },
                {
                    name: 'compile_zig',
                    description: 'Format Zig code using the official Zig formatter',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            code: {
                                type: 'string',
                                description: 'Zig source code to format',
                            },
                            zig_version: {
                                type: 'string',
                                enum: SUPPORTED_ZIG_VERSIONS as unknown as string[],
                                description: `Zig version to use for formatting (default: ${DEFAULT_ZIG_VERSION})`,
                            },
                        },
                        required: ['code'],
                    },
                },
                {
                    name: 'get_zig_docs',
                    description: 'Retrieve Zig documentation for specific topics',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            topic: {
                                type: 'string',
                                description:
                                    "Topic to get documentation for (e.g., 'comptime', 'generics')",
                            },
                        },
                        required: ['topic'],
                    },
                },
                {
                    name: 'suggest_fix',
                    description: 'Get intelligent suggestions for fixing Zig code errors',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            error: {
                                type: 'string',
                                description: 'Error message to get fix suggestions for',
                            },
                            code: {
                                type: 'string',
                                description: 'Code context where the error occurred',
                            },
                        },
                        required: ['error', 'code'],
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
            case 'analyze_zig': {
                const code = (args as { code?: string; zig_version?: string }).code;
                const zig_version = (args as { zig_version?: '0.13.0' | '0.14.0' | '0.15.0' })
                    .zig_version;

                if (!code) {
                    throw new Error('Missing required argument: code');
                }

                const result = await analyzeZig({ code, zig_version });
                return {
                    content: [
                        {
                            type: 'text',
                            text: formatAnalyzeResult(result),
                        },
                    ],
                };
            }

            case 'compile_zig': {
                const compileArgs = args as {
                    code?: string;
                    zig_version?: '0.13.0' | '0.14.0' | '0.15.0';
                };
                if (!compileArgs.code) {
                    throw new Error('Missing required argument: code');
                }

                const result = await compileZig({
                    code: compileArgs.code,
                    zig_version: compileArgs.zig_version,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: formatCompileResult(result),
                        },
                    ],
                };
            }

            case "get_zig_docs": {
                const docsArgs = args as {
                    topic?: string;
                    detail_level?: "basic" | "intermediate" | "advanced";
                };
                if (!docsArgs.topic) {
                    throw new Error("Missing required argument: topic");
                }

                const result = await getZigDocs({
                    topic: docsArgs.topic,
                    detail_level: docsArgs.detail_level,
                });

                return {
                    content: [
                        {
                            type: "text",
                            text: `# Zig Documentation: ${result.topic}\n\n${result.documentation}`,
                        },
                    ],
                };
            }

            case "suggest_fix": {
                const fixArgs = args as {
                    error_message?: string;
                    code_context?: string;
                    error_type?: "syntax" | "type" | "semantic" | "runtime";
                };
                if (!fixArgs.error_message) {
                    throw new Error("Missing required argument: error_message");
                }

                const result = await suggestFix({
                    error_message: fixArgs.error_message,
                    code_context: fixArgs.code_context,
                    error_type: fixArgs.error_type,
                });

                // Format fixes
                const fixesText = result.suggested_fixes
                    .map(
                        (fix, i) =>
                            `## Fix ${i + 1}: ${fix.description}\n\n\`\`\`zig\n${fix.code_after}\n\`\`\`\n\n**Rationale**: ${fix.rationale}`,
                    )
                    .join("\n\n");

                return {
                    content: [
                        {
                            type: "text",
                            text: `# Error Fix Suggestions\n\n**Error**: ${result.error_summary}\n\n${fixesText}\n\n## Full Analysis\n\n${result.explanation}`,
                        },
                    ],
                };
            }

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
    console.error('🚀 ZigNet MCP Server starting...');

    // Log configuration
    console.error(`📋 Configuration:`);
    console.error(`   - Zig versions: ${SUPPORTED_ZIG_VERSIONS.join(', ')}`);
    console.error(`   - Default version: ${DEFAULT_ZIG_VERSION}`);

    // Check and download model if needed
    const { modelDownloader } = await import('./llm/model-downloader.js');
    const modelAvailable = modelDownloader.isModelAvailable();

    console.error(`🤖 Model status:`);
    if (modelAvailable) {
        console.error(`   ✅ Model ready: ${modelDownloader.getModelPath()}`);
    } else {
        console.error(`   📥 Model not found - downloading now...`);
        console.error(`   📍 Target: ${modelDownloader.getModelPath()}`);

        try {
            let lastLoggedPercent = -1;
            await modelDownloader.ensureModel((progress) => {
                // Log progress every 5% (only when crossing the threshold)
                const currentMilestone = Math.floor(progress.percent / 5) * 5;
                if (currentMilestone > lastLoggedPercent && currentMilestone % 5 === 0) {
                    console.error(`   📦 Download progress: ${currentMilestone}% (${(progress.downloaded / 1024 / 1024).toFixed(0)}MB / ${(progress.total / 1024 / 1024).toFixed(0)}MB)`);
                    lastLoggedPercent = currentMilestone;
                }
            });
            console.error(`   ✅ Model downloaded successfully!`);
        } catch (error) {
            console.error(`   ⚠️  Model download failed: ${error}`);
            console.error(`   ℹ️  LLM tools (get_zig_docs, suggest_fix) will not be available`);
            console.error(`   ℹ️  Deterministic tools (analyze_zig, compile_zig) will still work`);
        }
    }

    const server = createServer();
    const transport = new StdioServerTransport();

    await server.connect(transport);

    console.error('✅ ZigNet MCP Server running on stdio');
    console.error('📡 Available tools: analyze_zig, compile_zig, get_zig_docs, suggest_fix');
} main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
