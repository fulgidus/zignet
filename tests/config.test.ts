/**
 * Configuration tests
 */

import { describe, it, expect } from "vitest";
import { GPU_DEVICE, getConfigSummary } from "../src/config.js";

describe("GPU Device Configuration", () => {
    it("should export GPU_DEVICE configuration", () => {
        // GPU_DEVICE should be either undefined or a string
        expect(typeof GPU_DEVICE === "undefined" || typeof GPU_DEVICE === "string").toBe(
            true,
        );
    });

    it("should include GPU_DEVICE in config summary", () => {
        const summary = getConfigSummary();
        expect(summary).toContain("GPU_DEVICE");
    });

    it("should show appropriate GPU_DEVICE value or auto in summary", () => {
        const summary = getConfigSummary();
        if (GPU_DEVICE) {
            expect(summary).toContain(GPU_DEVICE);
        } else {
            expect(summary).toContain("auto");
        }
    });
});

describe("LLM Configuration", () => {
    it("should export GPU_DEVICE configuration", async () => {
        const config = await import("../src/config.js");
        expect(config).toHaveProperty("GPU_DEVICE");
    });

    it("should export other LLM configuration values", async () => {
        const config = await import("../src/config.js");
        expect(config).toHaveProperty("MODEL_PATH");
        expect(config).toHaveProperty("GPU_LAYERS");
        expect(config).toHaveProperty("CONTEXT_SIZE");
        expect(config).toHaveProperty("TEMPERATURE");
        expect(config).toHaveProperty("TOP_P");
    });
});
