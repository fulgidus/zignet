/**
 * ZigNet Configuration
 *
 * Centralized configuration management based on environment variables.
 * Controls Zig versions for documentation scraping, compilation, and defaults.
 * Also manages LLM model settings for ZigNet's intelligent features.
 */

import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Parse comma-separated Zig versions from environment variable
 */
function parseZigVersions(envVar: string | undefined, fallback: string[]): string[] {
    if (!envVar) {
        return fallback;
    }

    return envVar
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
}

/**
 * Supported Zig versions (from ZIG_SUPPORTED env var)
 * Default: "0.13.0,0.14.0,0.15.2"
 *
 * Example:
 *   export ZIG_SUPPORTED="0.13.0,0.14.0,0.15.2"
 */
export const SUPPORTED_ZIG_VERSIONS = parseZigVersions(process.env.ZIG_SUPPORTED, [
    '0.13.0',
    '0.14.0',
    '0.15.2',
]) as readonly string[];

export type ZigVersion = (typeof SUPPORTED_ZIG_VERSIONS)[number];

/**
 * Default Zig version (from ZIG_DEFAULT env var)
 * Default: "0.15.2"
 *
 * Example:
 *   export ZIG_DEFAULT="0.15.2"
 */
export const DEFAULT_ZIG_VERSION = (process.env.ZIG_DEFAULT || '0.15.2') as ZigVersion;

/**
 * Validate that default version is in supported versions
 */
if (!SUPPORTED_ZIG_VERSIONS.includes(DEFAULT_ZIG_VERSION)) {
    throw new Error(
        `ZIG_DEFAULT (${DEFAULT_ZIG_VERSION}) is not in ZIG_SUPPORTED (${SUPPORTED_ZIG_VERSIONS.join(', ')})`
    );
}

/**
 * Get configuration summary for logging
 */
export function getConfigSummary(): string {
    return `
ZigNet Configuration:
  Zig Versions:
    ZIG_SUPPORTED: ${SUPPORTED_ZIG_VERSIONS.join(", ")}
    ZIG_DEFAULT: ${DEFAULT_ZIG_VERSION}
  
  LLM Model:
    MODEL_PATH: ${MODEL_PATH}
    MODEL_AUTO_DOWNLOAD: ${MODEL_AUTO_DOWNLOAD}
    GPU_DEVICE: ${GPU_DEVICE || "auto (all available GPUs)"}
    GPU_LAYERS: ${GPU_LAYERS}
    CONTEXT_SIZE: ${CONTEXT_SIZE}
    TEMPERATURE: ${TEMPERATURE}
    TOP_P: ${TOP_P}
`.trim();
}

/**
 * Validate a Zig version string
 */
export function isValidZigVersion(version: string): version is ZigVersion {
    return SUPPORTED_ZIG_VERSIONS.includes(version);
}

/**
 * Get Zig version or fallback to default
 */
export function getZigVersionOrDefault(version?: string): ZigVersion {
    if (!version) {
        return DEFAULT_ZIG_VERSION;
    }

    if (isValidZigVersion(version)) {
        return version;
    }

    console.warn(`Invalid Zig version "${version}", falling back to ${DEFAULT_ZIG_VERSION}`);
    return DEFAULT_ZIG_VERSION;
}

// ============================================================================
// LLM Configuration
// ============================================================================

/**
 * Path to the GGUF model file
 * Default: ~/.zignet/models/zignet-qwen-7b-q4km.gguf
 *
 * Example:
 *   export ZIGNET_MODEL_PATH="/path/to/custom/model.gguf"
 */
export const MODEL_PATH =
    process.env.ZIGNET_MODEL_PATH ||
    join(homedir(), ".zignet", "models", "zignet-qwen-7b-q4km.gguf");

/**
 * Auto-download model from HuggingFace if not found
 * Default: true
 *
 * Example:
 *   export ZIGNET_MODEL_AUTO_DOWNLOAD="false"
 */
export const MODEL_AUTO_DOWNLOAD = process.env.ZIGNET_MODEL_AUTO_DOWNLOAD !== "false";

/**
 * GPU device selection (CUDA_VISIBLE_DEVICES)
 * Specify which GPU(s) to use for CUDA inference
 * Default: undefined (use all available GPUs)
 *
 * Examples:
 *   export ZIGNET_GPU_DEVICE="0"     # Use first GPU only (e.g., RTX 4090)
 *   export ZIGNET_GPU_DEVICE="1"     # Use second GPU only
 *   export ZIGNET_GPU_DEVICE="0,1"   # Use first and second GPUs
 *
 * Note: GPU indices are system-dependent. Use `nvidia-smi` to list available GPUs.
 * This sets CUDA_VISIBLE_DEVICES before loading the model.
 */
export const GPU_DEVICE = process.env.ZIGNET_GPU_DEVICE;

/**
 * Number of layers to offload to GPU
 * Default: 35 (all layers for RTX 3090)
 * Set to 0 for CPU-only inference
 *
 * Example:
 *   export ZIGNET_GPU_LAYERS="0"  # CPU only
 *   export ZIGNET_GPU_LAYERS="20" # Partial GPU
 *   export ZIGNET_GPU_LAYERS="35" # Full GPU (RTX 3090)
 */
export const GPU_LAYERS = parseInt(process.env.ZIGNET_GPU_LAYERS || "35", 10);

/**
 * LLM context size (max tokens)
 * Default: 4096
 *
 * Example:
 *   export ZIGNET_CONTEXT_SIZE="8192"
 */
export const CONTEXT_SIZE = parseInt(process.env.ZIGNET_CONTEXT_SIZE || "4096", 10);

/**
 * LLM temperature (creativity)
 * Default: 0.7
 *
 * Example:
 *   export ZIGNET_TEMPERATURE="0.5"
 */
export const TEMPERATURE = parseFloat(process.env.ZIGNET_TEMPERATURE || "0.7");

/**
 * LLM top-p sampling
 * Default: 0.9
 *
 * Example:
 *   export ZIGNET_TOP_P="0.8"
 */
export const TOP_P = parseFloat(process.env.ZIGNET_TOP_P || "0.9");
