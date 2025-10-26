/**
 * MCP server implementation for zignet
 * Logs only to stderr
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { tools } from './tools.js';
import { generate } from './model.js';

/**
 * Create and configure the MCP server
 */
export function createServer() {
  console.error('[server] Creating MCP server...');
  
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

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    console.error('[server] Listing tools');
    return {
      tools: tools,
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    console.error(`[server] Tool called: ${request.params.name}`);
    
    const { name, arguments: args } = request.params;
    
    try {
      let result;
      
      switch (name) {
        case 'generate_zig_code':
          result = await handleGenerateZigCode(args);
          break;
        case 'debug_zig_code':
          result = await handleDebugZigCode(args);
          break;
        case 'explain_zig_docs':
          result = await handleExplainZigDocs(args);
          break;
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
      
      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      console.error(`[server] Error handling tool ${name}: ${error.message}`);
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Handle generate_zig_code tool
 */
async function handleGenerateZigCode(args) {
  console.error('[server] Handling generate_zig_code');
  
  const { description, context } = args;
  
  const systemPrompt = 'You are an expert Zig programmer. Generate clean, idiomatic Zig code following best practices. Include comments explaining the code.';
  
  let prompt = `Generate Zig code for the following:\n\n${description}`;
  if (context) {
    prompt += `\n\nContext: ${context}`;
  }
  
  const response = await generate(prompt, systemPrompt);
  return response;
}

/**
 * Handle debug_zig_code tool
 */
async function handleDebugZigCode(args) {
  console.error('[server] Handling debug_zig_code');
  
  const { code, error_message, issue_description } = args;
  
  const systemPrompt = 'You are an expert Zig debugger. Analyze code, identify issues, and provide clear explanations and fixes.';
  
  let prompt = `Debug this Zig code:\n\n\`\`\`zig\n${code}\n\`\`\`\n\n`;
  if (error_message) {
    prompt += `Error message: ${error_message}\n\n`;
  }
  if (issue_description) {
    prompt += `Issue: ${issue_description}\n\n`;
  }
  prompt += 'Explain the problem and suggest a fix.';
  
  const response = await generate(prompt, systemPrompt);
  return response;
}

/**
 * Handle explain_zig_docs tool
 */
async function handleExplainZigDocs(args) {
  console.error('[server] Handling explain_zig_docs');
  
  const { topic, detail_level = 'intermediate' } = args;
  
  const systemPrompt = 'You are an expert Zig educator. Explain Zig concepts clearly with examples.';
  
  const prompt = `Explain the following Zig topic at a ${detail_level} level:\n\n${topic}\n\nProvide clear explanations with code examples where appropriate.`;
  
  const response = await generate(prompt, systemPrompt);
  return response;
}

/**
 * Start the MCP server
 */
export async function startServer() {
  console.error('[server] Starting MCP server...');
  
  const server = createServer();
  const transport = new StdioServerTransport();
  
  await server.connect(transport);
  
  console.error('[server] MCP server running on stdio');
}
