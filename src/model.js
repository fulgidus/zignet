/**
 * Model loading and text generation using node-llama-cpp
 * Logs only to stderr
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getLlama, LlamaChatSession } from 'node-llama-cpp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let modelInstance = null;
let contextInstance = null;

/**
 * Load the LLM model
 */
export async function loadModel(modelPath) {
  console.error(`[model] Loading model from: ${modelPath}`);
  
  try {
    const llama = await getLlama();
    console.error('[model] Llama instance created');
    
    const model = await llama.loadModel({
      modelPath: modelPath,
    });
    console.error('[model] Model loaded successfully');
    
    const context = await model.createContext({
      contextSize: 2048,
    });
    console.error('[model] Context created');
    
    modelInstance = model;
    contextInstance = context;
    
    return { model, context };
  } catch (error) {
    console.error(`[model] Error loading model: ${error.message}`);
    throw error;
  }
}

/**
 * Generate text using the loaded model
 */
export async function generate(prompt, systemPrompt = null) {
  if (!modelInstance || !contextInstance) {
    throw new Error('Model not loaded. Call loadModel() first.');
  }
  
  console.error('[model] Starting text generation...');
  
  try {
    const session = new LlamaChatSession({
      contextSequence: contextInstance.getSequence(),
    });
    
    const messages = [];
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }
    messages.push({
      role: 'user',
      content: prompt,
    });
    
    console.error(`[model] Generating with prompt length: ${prompt.length}`);
    
    const response = await session.prompt(prompt, {
      maxTokens: 1024,
      temperature: 0.7,
    });
    
    console.error(`[model] Generated response length: ${response.length}`);
    
    return response;
  } catch (error) {
    console.error(`[model] Error generating text: ${error.message}`);
    throw error;
  }
}

/**
 * Unload the model and free resources
 */
export async function unloadModel() {
  console.error('[model] Unloading model...');
  
  if (contextInstance) {
    await contextInstance.dispose();
    contextInstance = null;
  }
  
  if (modelInstance) {
    await modelInstance.dispose();
    modelInstance = null;
  }
  
  console.error('[model] Model unloaded');
}
