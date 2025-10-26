import {
    getLlama,
    LlamaModel,
    LlamaContext,
    LlamaChatSession,
} from "node-llama-cpp";
import { modelDownloader } from "./model-downloader.js";

export interface LLMConfig {
    modelPath?: string;
    gpuLayers?: number;
    contextSize?: number;
    temperature?: number;
    topP?: number;
}

export class ZigNetLLM {
    private model: LlamaModel | null = null;
    private context: LlamaContext | null = null;
    private session: LlamaChatSession | null = null;
    private config: Required<LLMConfig>;

    constructor(config: LLMConfig = {}) {
        this.config = {
            modelPath: config.modelPath || "",
            gpuLayers: config.gpuLayers ?? 35, // RTX 3090 can handle all layers
            contextSize: config.contextSize ?? 4096,
            temperature: config.temperature ?? 0.7,
            topP: config.topP ?? 0.9,
        };
    }

    /**
     * Initialize the LLM model and session
     */
    async initialize(): Promise<void> {
        if (this.session) {
            console.log("ℹ️  LLM already initialized");
            return;
        }

        console.log("🚀 Initializing ZigNet LLM...");

        // Get model path (download if needed)
        const modelPath =
            this.config.modelPath ||
            (await modelDownloader.ensureModel((progress) => {
                if (progress.percent % 10 < 1) {
                    // Log every 10%
                    console.log(
                        `📥 Downloading model: ${progress.percent.toFixed(1)}%`,
                    );
                }
            }));

        console.log(`📦 Loading model: ${modelPath}`);
        console.log(`🎮 GPU layers: ${this.config.gpuLayers}`);

        // Initialize llama
        const llama = await getLlama();

        // Load model
        this.model = await llama.loadModel({
            modelPath,
            gpuLayers: this.config.gpuLayers,
        });

        // Create context
        this.context = await this.model.createContext({
            contextSize: this.config.contextSize,
        });

        // Create chat session with Zig-specific system prompt
        this.session = new LlamaChatSession({
            contextSequence: this.context.getSequence(),
            systemPrompt: `You are ZigNet, an AI assistant specialized in Zig programming language (v0.13-0.15).

Your expertise includes:
- Explaining Zig syntax, features, and idioms
- Understanding comptime, generics, and error handling
- Providing code examples and fixes
- Referencing official Zig documentation

Always:
- Generate idiomatic Zig code
- Explain Zig-specific concepts clearly
- Suggest best practices
- Validate syntax mentally before responding

When unsure, reference official Zig docs or suggest using 'zig ast-check'.`,
        });

        console.log("✅ LLM initialized successfully!");
    }

    /**
     * Query the LLM with a prompt
     */
    async query(prompt: string): Promise<string> {
        if (!this.session) {
            await this.initialize();
        }

        if (!this.session) {
            throw new Error("Failed to initialize LLM session");
        }

        console.log(`🤔 Querying LLM: ${prompt.substring(0, 50)}...`);

        const response = await this.session.prompt(prompt, {
            temperature: this.config.temperature,
            topP: this.config.topP,
        });

        return response;
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        if (this.context) {
            void this.context.dispose();
            this.context = null;
        }
        if (this.model) {
            void this.model.dispose();
            this.model = null;
        }
        this.session = null;
        console.log("🗑️  LLM resources disposed");
    }
}

/**
 * Singleton instance
 */
let globalLLM: ZigNetLLM | null = null;

/**
 * Get or create the global LLM instance
 */
export async function getLLM(config?: LLMConfig): Promise<ZigNetLLM> {
    if (!globalLLM) {
        globalLLM = new ZigNetLLM(config);
        await globalLLM.initialize();
    }
    return globalLLM;
}

/**
 * Dispose the global LLM instance
 */
export function disposeLLM(): void {
    if (globalLLM) {
        globalLLM.dispose();
        globalLLM = null;
    }
}
