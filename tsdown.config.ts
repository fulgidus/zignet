import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    // MCP Server entry point (future)
    "mcp-server": "src/mcp-server.ts",
    
    // Core analysis components
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
  
  // Splitting for better tree-shaking
  splitting: true,
  
  // Show bundle analysis
  bundle: true,
  
  // Treeshake unused code
  treeshake: true,
});
