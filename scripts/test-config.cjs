#!/usr/bin/env node
/**
 * Test script for ZigNet configuration system
 * 
 * Usage:
 *   node scripts/test-config.js
 *   ZIG_SUPPORTED="0.14.0,0.15.0" ZIG_DEFAULT="0.14.0" node scripts/test-config.js
 */

/**
 * Helper to clear all config-related modules from cache
 */
function clearConfigCache() {
    Object.keys(require.cache).forEach(key => {
        if (key.includes('/dist/config')) {
            delete require.cache[key];
        }
    });
}

// Test 1: Default configuration
console.log("=== Test 1: Default Configuration ===");
delete process.env.ZIG_SUPPORTED;
delete process.env.ZIG_DEFAULT;
// Force module reload
clearConfigCache();
const config1 = require("../dist/config.cjs");
console.log("✅ Config loaded with defaults");

// Test 2: Custom configuration
console.log("\n=== Test 2: Custom Configuration ===");
process.env.ZIG_SUPPORTED = "0.14.0,0.15.0";
process.env.ZIG_DEFAULT = "0.14.0";
clearConfigCache();
const config2 = require("../dist/config.cjs");
console.log("✅ Config loaded with custom values");
console.log("   ZIG_SUPPORTED:", process.env.ZIG_SUPPORTED);
console.log("   ZIG_DEFAULT:", process.env.ZIG_DEFAULT);

// Test 3: Invalid configuration (DEFAULT not in SUPPORTED)
console.log("\n=== Test 3: Invalid Configuration (should fail) ===");
// Run in a child process since the error is thrown at module load time
const { spawnSync } = require("child_process");
const result = spawnSync(
    process.execPath,
    [
        "-e",
        `
        process.env.ZIG_SUPPORTED = "0.14.0,0.15.0";
        process.env.ZIG_DEFAULT = "0.13.0";
        require("./dist/config.cjs");
        `
    ],
    {
        cwd: __dirname + "/..",
        encoding: "utf8",
        shell: false
    }
);

if (result.status !== 0 && result.stderr.includes("ZIG_DEFAULT")) {
    console.log("✅ Correctly rejected invalid config");
} else {
    console.log("❌ FAILED: Should have thrown error");
    console.log("   Status:", result.status);
    console.log("   Stderr:", result.stderr);
    process.exit(1);
}

console.log("\n=== All Tests Passed ===");
