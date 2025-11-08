/**
 * LLM Session GPU device selection tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ZigNetLLM } from "../src/llm/session.js";

describe("ZigNetLLM GPU Device Selection", () => {
    const originalCudaVisibleDevices = process.env.CUDA_VISIBLE_DEVICES;

    beforeEach(() => {
        // Clear CUDA_VISIBLE_DEVICES before each test
        delete process.env.CUDA_VISIBLE_DEVICES;
    });

    afterEach(() => {
        // Restore original env
        if (originalCudaVisibleDevices === undefined) {
            delete process.env.CUDA_VISIBLE_DEVICES;
        } else {
            process.env.CUDA_VISIBLE_DEVICES = originalCudaVisibleDevices;
        }
    });

    it("should accept gpuDevice in config", () => {
        const llm = new ZigNetLLM({
            gpuDevice: "0",
            gpuLayers: 35,
        });
        expect(llm).toBeDefined();
    });

    it("should accept undefined gpuDevice in config", () => {
        const llm = new ZigNetLLM({
            gpuLayers: 35,
        });
        expect(llm).toBeDefined();
    });

    it("should accept multiple GPUs in gpuDevice", () => {
        const llm = new ZigNetLLM({
            gpuDevice: "0,1",
            gpuLayers: 35,
        });
        expect(llm).toBeDefined();
    });

    // Note: We can't easily test the actual CUDA_VISIBLE_DEVICES setting
    // without mocking node-llama-cpp, but we can verify the config is stored
    it("should store gpuDevice config correctly", () => {
        const llm = new ZigNetLLM({
            gpuDevice: "1",
            gpuLayers: 20,
        });
        // Access private config for testing (TypeScript will complain, but it works at runtime)
        const config = (llm as any).config;
        expect(config.gpuDevice).toBe("1");
        expect(config.gpuLayers).toBe(20);
    });

    it("should handle gpuDevice as undefined when not specified", () => {
        const llm = new ZigNetLLM({
            gpuLayers: 10,
        });
        const config = (llm as any).config;
        expect(config.gpuDevice).toBeUndefined();
    });
});

describe("LLM Config Interface", () => {
    it("should allow LLMConfig with all fields", () => {
        const config = {
            modelPath: "/path/to/model.gguf",
            gpuDevice: "0",
            gpuLayers: 35,
            contextSize: 4096,
            temperature: 0.7,
            topP: 0.9,
        };

        const llm = new ZigNetLLM(config);
        expect(llm).toBeDefined();
    });

    it("should allow LLMConfig with optional gpuDevice", () => {
        const config = {
            modelPath: "/path/to/model.gguf",
            gpuLayers: 35,
            contextSize: 4096,
            temperature: 0.7,
            topP: 0.9,
        };

        const llm = new ZigNetLLM(config);
        expect(llm).toBeDefined();
    });

    it("should allow empty LLMConfig", () => {
        const llm = new ZigNetLLM({});
        expect(llm).toBeDefined();
    });
});
