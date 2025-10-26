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
import { analyzeZig, formatAnalyzeResult } from './tools/analyze.js';
import { compileZig, formatCompileResult } from './tools/compile.js';

// Import configuration
import { SUPPORTED_ZIG_VERSIONS, DEFAULT_ZIG_VERSION } from './config.js';

/**
 * Create and configure the MCP server
 */
function createServer() {
  const server = new Server(
    {
      name: 'zignet',
      version: '0.1.0',
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
                description: "Topic to get documentation for (e.g., 'comptime', 'generics')",
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
        const zig_version = (args as { zig_version?: '0.13.0' | '0.14.0' | '0.15.0' }).zig_version;

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
        const compileArgs = args as { code?: string; zig_version?: '0.13.0' | '0.14.0' | '0.15.0' };
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

      case 'get_zig_docs':
        // TODO: Implement using fine-tuned LLM
        return {
          content: [
            {
              type: 'text',
              text: '⚠️ get_zig_docs tool not yet implemented\nWaiting for fine-tuned model!',
            },
          ],
        };

      case 'suggest_fix':
        // TODO: Implement using fine-tuned LLM
        return {
          content: [
            {
              type: 'text',
              text: '⚠️ suggest_fix tool not yet implemented\nWaiting for fine-tuned model!',
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

  console.error('ZigNet MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
