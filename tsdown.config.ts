import { defineConfig } from "tsdown";

export default defineConfig({
    entry: {
        // MCP Server entry point
        "mcp-server": "src/mcp-server.ts",

        // Configuration (for testing and programmatic use)
        config: "src/config.ts",

        // MCP Tools (exported for programmatic use)
        "tools/analyze": "src/tools/analyze.ts",
        "tools/compile": "src/tools/compile.ts",

        // Core analysis components (legacy, may be removed)
        lexer: "src/lexer.ts",
        parser: "src/parser.ts",
        "type-checker": "src/type-checker.ts",
        codegen: "src/codegen.ts",

        // Test tools (manual testing)
        "test-tools": "src/test-tools.ts",
    },

    // Output formats
    format: ["esm", "cjs"],

    // Output directory
    outDir: "dist",

    // Generate TypeScript declarations
    dts: true,

    // Target Node.js 20+
    target: "node20",

    // Clean output directory before build
    clean: true,

    // Minify for production
    minify: process.env.NODE_ENV === "production",

    // Sourcemaps for debugging
    sourcemap: true,

    // Bundle dependencies (except these)
    external: [
        "@modelcontextprotocol/sdk",
        "node-llama-cpp",
    ],

    // Show bundle analysis
    bundle: true,

    // Treeshake unused code
    treeshake: true,
});
