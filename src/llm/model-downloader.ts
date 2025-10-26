import { mkdir, unlink } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { Readable } from 'node:stream';
import { MODEL_PATH } from '../config.js';

const MODEL_REPO = 'fulgidus/zignet-qwen2.5-coder-7b';
const MODEL_FILE = 'gguf/zignet-qwen-7b-q4km.gguf';
const MODEL_SIZE_MB = 4400; // 4.4GB

export interface DownloadProgress {
    downloaded: number;
    total: number;
    percent: number;
}

export class ModelDownloader {
    private readonly modelPath: string;

    constructor() {
        this.modelPath = MODEL_PATH;
    }

    /**
     * Get the path to the model file
     */
    getModelPath(): string {
        return this.modelPath;
    }

    /**
     * Check if model is already downloaded
     */
    isModelAvailable(): boolean {
        return existsSync(this.modelPath);
    }

    /**
     * Download the GGUF model from HuggingFace
     */
    async downloadModel(onProgress?: (progress: DownloadProgress) => void): Promise<void> {
        if (this.isModelAvailable()) {
            console.log('✅ Model already downloaded:', this.modelPath);
            return;
        }

        console.log('📥 Downloading ZigNet model from HuggingFace...');
        console.log(`📦 Size: ${MODEL_SIZE_MB}MB`);
        console.log(`📍 Repo: ${MODEL_REPO}`);

        // Ensure models directory exists
        const modelsDir = dirname(this.modelPath);
        await mkdir(modelsDir, { recursive: true });

        // HuggingFace CDN URL
        const url = `https://huggingface.co/${MODEL_REPO}/resolve/main/${MODEL_FILE}`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to download model: ${response.statusText}`);
            }

            const totalBytes = parseInt(response.headers.get('content-length') || '0', 10);

            if (!response.body) {
                throw new Error('Response body is null');
            }

            const fileStream = createWriteStream(this.modelPath);
            let downloadedBytes = 0;

            // Convert Web ReadableStream to Node Readable
            const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);

            // Track progress
            nodeStream.on('data', (chunk: Buffer) => {
                downloadedBytes += chunk.length;

                if (onProgress && totalBytes > 0) {
                    onProgress({
                        downloaded: downloadedBytes,
                        total: totalBytes,
                        percent: (downloadedBytes / totalBytes) * 100,
                    });
                }
            });

            // Pipe to file
            await new Promise<void>((resolve, reject) => {
                nodeStream.pipe(fileStream);
                nodeStream.on('error', reject);
                fileStream.on('error', reject);
                fileStream.on('finish', resolve);
            });

            console.log('✅ Model downloaded successfully!');
            console.log(`📁 Location: ${this.modelPath}`);
        } catch (error) {
            // Clean up partial download
            if (existsSync(this.modelPath)) {
                await unlink(this.modelPath);
            }

            throw new Error(
                `Failed to download model: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Ensure model is downloaded, download if needed
     */
    async ensureModel(onProgress?: (progress: DownloadProgress) => void): Promise<string> {
        if (!this.isModelAvailable()) {
            await this.downloadModel(onProgress);
        }

        return this.modelPath;
    }
}

/**
 * Singleton instance
 */
export const modelDownloader = new ModelDownloader();
