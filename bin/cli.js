#!/usr/bin/env node
/**
 * CLI entrypoint for ZigNet MCP server
 * Uses file:// URLs for cross-platform Windows/Linux/macOS compatibility
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

// Get absolute path to this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve absolute path to MCP server
const serverPath = join(__dirname, '..', 'dist', 'mcp-server.js');

// Convert to file:// URL for dynamic import (required on Windows)
const serverURL = pathToFileURL(serverPath).href;

// Import and execute the MCP server
import(serverURL);
