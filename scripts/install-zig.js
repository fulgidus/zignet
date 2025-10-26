#!/usr/bin/env node

/**
 * Install Zig versions for ZigNet
 * 
 * Usage:
 *   node scripts/install-zig.js [version]
 *   node scripts/install-zig.js all
 */

import { installZig, installAllVersions, listInstalledVersions, SUPPORTED_ZIG_VERSIONS } from "../dist/zig/manager.js";

const version = process.argv[2];

async function main() {
    console.log("🔧 ZigNet - Zig Version Installer\n");

    if (!version) {
        console.log("Usage:");
        console.log("  node scripts/install-zig.js [version]");
        console.log("  node scripts/install-zig.js all");
        console.log(`\nSupported versions: ${SUPPORTED_ZIG_VERSIONS.join(", ")}`);
        console.log(`\nInstalled versions: ${listInstalledVersions().join(", ") || "none"}`);
        process.exit(1);
    }

    if (version === "all") {
        console.log("📦 Installing all supported Zig versions...\n");
        await installAllVersions();
        console.log("\n✅ All versions installed successfully!");
    } else if (SUPPORTED_ZIG_VERSIONS.includes(version)) {
        console.log(`📦 Installing Zig ${version}...\n`);
        await installZig(version);
        console.log(`\n✅ Zig ${version} installed successfully!`);
    } else {
        console.error(`❌ Unsupported version: ${version}`);
        console.log(`Supported versions: ${SUPPORTED_ZIG_VERSIONS.join(", ")}`);
        process.exit(1);
    }

    console.log(`\nInstalled versions: ${listInstalledVersions().join(", ")}`);
}

main().catch((error) => {
    console.error("❌ Installation failed:", error.message);
    process.exit(1);
});
