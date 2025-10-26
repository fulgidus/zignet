#!/usr/bin/env node
/**
 * CLI entrypoint for ZigNet MCP server
 * Uses absolute paths for cross-platform Windows/Linux/macOS compatibility
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Get absolute path to this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve absolute path to MCP server (works on Windows and Unix)
const serverPath = join(__dirname, '..', 'dist', 'mcp-server.js');

// Import and execute the MCP server
import(serverPath);
