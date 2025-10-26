/**
 * HuggingFace model download script
 * Placeholder for downloading Zig-focused LLM models
 * Logs only to stderr
 */

import { downloadFile } from '@huggingface/hub';
import { getModelPath, ensureCacheDir } from '../src/download.js';

/**
 * Download a model from HuggingFace
 * This is a placeholder implementation
 */
export async function downloadModel(modelName = 'model.gguf') {
  console.error('[download-model] Starting model download...');
  
  await ensureCacheDir();
  const modelPath = getModelPath(modelName);
  
  // Placeholder: In a real implementation, this would download from HuggingFace
  // Example repository: 'TheBloke/Llama-2-7B-GGUF'
  // Example file: 'llama-2-7b.Q4_K_M.gguf'
  
  const repoId = process.env.ZIGNET_MODEL_REPO || 'TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF';
  const filename = process.env.ZIGNET_MODEL_FILE || 'tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf';
  
  console.error(`[download-model] Downloading from ${repoId}/${filename}`);
  console.error(`[download-model] Target path: ${modelPath}`);
  
  try {
    // Download the model file from HuggingFace
    await downloadFile({
      repo: repoId,
      path: filename,
      outputPath: modelPath,
    });
    
    console.error('[download-model] Download complete!');
    return modelPath;
  } catch (error) {
    console.error(`[download-model] Error downloading model: ${error.message}`);
    console.error('[download-model] Please ensure you have internet connection and the model exists');
    throw error;
  }
}

// Allow direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  downloadModel()
    .then((path) => {
      console.error(`[download-model] Model downloaded to: ${path}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(`[download-model] Failed: ${error.message}`);
      process.exit(1);
    });
}
