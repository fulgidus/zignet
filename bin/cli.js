#!/usr/bin/env node
/**
 * CLI entrypoint for zignet MCP server
 * Downloads model if needed, then starts MCP stdio server
 * Logs only to stderr
 */

import { downloadModelIfNeeded, getModelPath } from '../src/download.js';
import { loadModel } from '../src/model.js';
import { startServer } from '../src/server.js';

async function main() {
  console.error('[cli] Starting zignet...');
  
  try {
    // Download model if not cached
    const modelName = process.env.ZIGNET_MODEL_NAME || 'tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf';
    console.error(`[cli] Ensuring model is available: ${modelName}`);
    
    await downloadModelIfNeeded(modelName);
    const modelPath = getModelPath(modelName);
    
    // Load the model
    console.error('[cli] Loading model...');
    await loadModel(modelPath);
    
    // Start MCP server
    console.error('[cli] Starting MCP server...');
    await startServer();
    
  } catch (error) {
    console.error(`[cli] Fatal error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle cleanup on exit
process.on('SIGINT', async () => {
  console.error('[cli] Received SIGINT, shutting down...');
  const { unloadModel } = await import('../src/model.js');
  await unloadModel();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('[cli] Received SIGTERM, shutting down...');
  const { unloadModel } = await import('../src/model.js');
  await unloadModel();
  process.exit(0);
});

main();
