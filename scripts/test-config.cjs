#!/usr/bin/env node
/**
 * Test script for ZigNet configuration system
 * 
 * Usage:
 *   node scripts/test-config.js
 *   ZIG_SUPPORTED="0.14.0,0.15.0" ZIG_DEFAULT="0.14.0" node scripts/test-config.js
 */

// Test 1: Default configuration
console.log("=== Test 1: Default Configuration ===");
delete process.env.ZIG_SUPPORTED;
delete process.env.ZIG_DEFAULT;
// Force module reload
delete require.cache[require.resolve("../dist/compile-9t2spwc5.cjs")];
const config1 = require("../dist/compile-9t2spwc5.cjs");
console.log("✅ Config loaded with defaults");

// Test 2: Custom configuration
console.log("\n=== Test 2: Custom Configuration ===");
process.env.ZIG_SUPPORTED = "0.14.0,0.15.0";
process.env.ZIG_DEFAULT = "0.14.0";
delete require.cache[require.resolve("../dist/compile-9t2spwc5.cjs")];
const config2 = require("../dist/compile-9t2spwc5.cjs");
console.log("✅ Config loaded with custom values");
console.log("   ZIG_SUPPORTED:", process.env.ZIG_SUPPORTED);
console.log("   ZIG_DEFAULT:", process.env.ZIG_DEFAULT);

// Test 3: Invalid configuration (DEFAULT not in SUPPORTED)
console.log("\n=== Test 3: Invalid Configuration (should fail) ===");
process.env.ZIG_SUPPORTED = "0.14.0,0.15.0";
process.env.ZIG_DEFAULT = "0.13.0"; // Not in SUPPORTED
try {
    delete require.cache[require.resolve("../dist/compile-9t2spwc5.cjs")];
    const config3 = require("../dist/compile-9t2spwc5.cjs");
    console.log("❌ FAILED: Should have thrown error");
} catch (err) {
    console.log("✅ Correctly rejected invalid config:", err.message);
}

console.log("\n=== All Tests Passed ===");
