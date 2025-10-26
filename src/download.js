/**
 * Model download and cache management
 * Logs only to stderr
 */

import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

/**
 * Get the path to the model cache directory
 */
export function getModelCachePath() {
  const cacheDir = process.env.ZIGNET_CACHE_DIR || join(homedir(), '.cache', 'zignet');
  return cacheDir;
}

/**
 * Get the path to a specific model file
 */
export function getModelPath(modelName = 'model.gguf') {
  return join(getModelCachePath(), modelName);
}

/**
 * Check if a model is already cached
 */
export function isModelCached(modelName = 'model.gguf') {
  const modelPath = getModelPath(modelName);
  const cached = existsSync(modelPath);
  console.error(`[download] Checking cache for ${modelName}: ${cached ? 'found' : 'not found'}`);
  return cached;
}

/**
 * Ensure the cache directory exists
 */
export async function ensureCacheDir() {
  const cachePath = getModelCachePath();
  if (!existsSync(cachePath)) {
    console.error(`[download] Creating cache directory: ${cachePath}`);
    await mkdir(cachePath, { recursive: true });
  }
  return cachePath;
}

/**
 * Download a model if not cached
 */
export async function downloadModelIfNeeded(modelName = 'model.gguf') {
  if (isModelCached(modelName)) {
    console.error(`[download] Model ${modelName} already cached`);
    return getModelPath(modelName);
  }

  console.error(`[download] Model ${modelName} not found in cache, downloading...`);
  await ensureCacheDir();
  
  // Import download script
  const { downloadModel } = await import('../scripts/download-model.js');
  await downloadModel(modelName);
  
  return getModelPath(modelName);
}
