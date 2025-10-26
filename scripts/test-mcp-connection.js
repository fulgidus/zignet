#!/usr/bin/env node

/**
 * Test script to verify MCP server is working
 * Simulates MCP protocol calls via stdio
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverPath = join(__dirname, 'dist', 'mcp-server.js');

console.log('🧪 Testing ZigNet MCP Server...\n');

// Start the MCP server
const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'inherit'], // stdin, stdout, stderr
});

let responseBuffer = '';
let requestId = 1;

// Listen to server output
server.stdout.on('data', (data) => {
    responseBuffer += data.toString();

    // Try to parse complete JSON-RPC messages
    const lines = responseBuffer.split('\n');
    responseBuffer = lines.pop() || ''; // Keep incomplete line

    for (const line of lines) {
        if (line.trim()) {
            try {
                const response = JSON.parse(line);
                console.log('📥 Response:', JSON.stringify(response, null, 2));
            } catch (e) {
                // Not JSON, might be initial output
            }
        }
    }
});

server.on('error', (err) => {
    console.error('❌ Server error:', err);
    process.exit(1);
});

server.on('close', (code) => {
    console.log(`\n✅ Server exited with code ${code}`);
    process.exit(code || 0);
});

// Helper to send JSON-RPC request
function sendRequest(method, params = {}) {
    const request = {
        jsonrpc: '2.0',
        id: requestId++,
        method,
        params,
    };

    console.log(`📤 Sending ${method}...`);
    server.stdin.write(JSON.stringify(request) + '\n');
}

// Wait a bit for server to start, then send test requests
setTimeout(() => {
    console.log('');

    // 1. Initialize
    sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
            name: 'test-client',
            version: '1.0.0',
        },
    });

    setTimeout(() => {
        // 2. List tools
        sendRequest('tools/list');

        setTimeout(() => {
            // 3. Test analyze_zig tool
            sendRequest('tools/call', {
                name: 'analyze_zig',
                arguments: {
                    code: 'fn add(a: i32, b: i32) i32 {\n    return a + b;\n}',
                },
            });

            setTimeout(() => {
                console.log('\n✅ Test complete! Shutting down...');
                server.kill();
            }, 2000);
        }, 1000);
    }, 1000);
}, 1000);

// Timeout safety
setTimeout(() => {
    console.error('\n⏱️  Test timeout - killing server');
    server.kill();
}, 15000);
