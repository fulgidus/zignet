#!/usr/bin/env node

/**
 * Install Zig versions for ZigNet
 * 
 * Usage:
 *   node scripts/install-zig.js [version]
 * 
 * This script uses the analyze tool to trigger Zig installation as a side effect.
 * The ensureZig() function will download and install Zig if not present.
 */

import { analyzeZig } from "../dist/tools/analyze.js";

const version = process.argv[2];
const SUPPORTED_VERSIONS = ["0.13.0", "0.14.0", "0.15.1"];

async function main() {
    console.log("🔧 ZigNet - Zig Version Installer\n");

    if (!version) {
        console.log("Usage:");
        console.log("  node scripts/install-zig.js <version>");
        console.log(`\nSupported versions: ${SUPPORTED_VERSIONS.join(", ")}`);
        process.exit(1);
    }

    if (!SUPPORTED_VERSIONS.includes(version)) {
        console.error(`❌ Unsupported version: ${version}`);
        console.log(`Supported versions: ${SUPPORTED_VERSIONS.join(", ")}`);
        process.exit(1);
    }

    console.log(`📦 Installing Zig ${version}...\n`);

    // Trigger Zig installation by running a simple analysis
    // This will call ensureZig() which downloads if needed
    const dummyCode = "fn dummy() void {}";
    analyzeZig({ code: dummyCode, zig_version: version });

    console.log(`\n✅ Zig ${version} installation complete!`);
}

main().catch((error) => {
    console.error("❌ Installation failed:", error.message);
    process.exit(1);
});
