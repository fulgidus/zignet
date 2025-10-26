/**
 * Zig Version Manager
 *
 * Handles downloading, caching, and managing multiple Zig versions.
 * Supports auto-detection of platform and lazy-loading of binaries.
 * Checks system PATH for existing Zig installations before downloading.
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, chmodSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { SUPPORTED_ZIG_VERSIONS, type ZigVersion } from '../config.js';

export { SUPPORTED_ZIG_VERSIONS, type ZigVersion };

/**
 * Detect system-installed Zig version
 * @returns Zig version string (e.g., "0.15.0") or null if not found
 */
export function detectSystemZig(): string | null {
    try {
        const output = execSync('zig version', {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'ignore'],
        });
        const version = output.trim();
        console.log(`🔍 Found system Zig: ${version}`);
        return version;
    } catch {
        // Zig not in PATH
        return null;
    }
}

/**
 * Get path to system Zig binary (if available)
 * @returns Absolute path to system zig binary or null
 */
export function getSystemZigPath(): string | null {
    try {
        const platform = process.platform;
        const command = platform === 'win32' ? 'where zig' : 'which zig';
        const output = execSync(command, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
        return output.trim();
    } catch {
        return null;
    }
}

/**
 * Platform detection
 */
type Platform = 'linux' | 'macos' | 'windows';
type Arch = 'x86_64' | 'aarch64';

interface PlatformInfo {
    platform: Platform;
    arch: Arch;
    ext: string;
}

/**
 * Detect current platform
 */
function detectPlatform(): PlatformInfo {
    const platform = process.platform;
    const arch = process.arch;

    let detectedPlatform: Platform;
    let detectedArch: Arch;

    // Platform
    if (platform === 'linux') {
        detectedPlatform = 'linux';
    } else if (platform === 'darwin') {
        detectedPlatform = 'macos';
    } else if (platform === 'win32') {
        detectedPlatform = 'windows';
    } else {
        throw new Error(`Unsupported platform: ${platform}`);
    }

    // Architecture
    if (arch === 'x64') {
        detectedArch = 'x86_64';
    } else if (arch === 'arm64') {
        detectedArch = 'aarch64';
    } else {
        throw new Error(`Unsupported architecture: ${arch}`);
    }

    // Extension
    const ext = detectedPlatform === 'windows' ? '.zip' : '.tar.xz';

    return { platform: detectedPlatform, arch: detectedArch, ext };
}

/**
 * Get Zig download URL for a specific version
 */
function getZigDownloadUrl(version: ZigVersion): string {
    const { platform, arch, ext } = detectPlatform();

    // Map platform names to Zig's naming convention
    const platformMap: Record<Platform, string> = {
        linux: 'linux',
        macos: 'macos',
        windows: 'windows',
    };

    const zigPlatform = platformMap[platform];

    // Zig changed filename format in 0.15.0:
    // - 0.13.0, 0.14.0: zig-{platform}-{arch}-{version}  (e.g., zig-linux-x86_64-0.13.0)
    // - 0.15.0+:        zig-{arch}-{platform}-{version}  (e.g., zig-x86_64-linux-0.15.0)
    const versionNum = parseFloat(version);
    const filename = versionNum >= 0.15
        ? `zig-${arch}-${zigPlatform}-${version}${ext}`  // New format (0.15.0+)
        : `zig-${zigPlatform}-${arch}-${version}${ext}`;  // Old format (0.13.0, 0.14.0)

    return `https://ziglang.org/download/${version}/${filename}`;
}

/**
 * Get cache directory for Zig installations
 */
export function getZigCacheDir(): string {
    const cacheDir = join(homedir(), '.zignet', 'zig-versions');
    if (!existsSync(cacheDir)) {
        mkdirSync(cacheDir, { recursive: true });
    }
    return cacheDir;
}

/**
 * Get installation path for a specific Zig version
 */
export function getZigInstallPath(version: ZigVersion): string {
    return join(getZigCacheDir(), version);
}

/**
 * Get Zig binary path for a specific version
 */
export function getZigBinaryPath(version: ZigVersion): string {
    const installPath = getZigInstallPath(version);
    const { platform, arch } = detectPlatform();
    const binaryName = platform === 'windows' ? 'zig.exe' : 'zig';

    const platformMap: Record<Platform, string> = {
        linux: 'linux',
        macos: 'macos',
        windows: 'windows',
    };
    const zigPlatform = platformMap[platform];

    // Match the extraction directory format with download filename format
    const versionNum = parseFloat(version);
    const extractDir = versionNum >= 0.15
        ? `zig-${arch}-${zigPlatform}-${version}`  // New format (0.15.0+)
        : `zig-${zigPlatform}-${arch}-${version}`;  // Old format (0.13.0, 0.14.0)

    return join(installPath, extractDir, binaryName);
}

/**
 * Check if a specific Zig version is installed
 */
export function isZigInstalled(version: ZigVersion): boolean {
    const binaryPath = getZigBinaryPath(version);
    return existsSync(binaryPath);
}

/**
 * Download and install a specific Zig version
 */
export function installZig(version: ZigVersion): void {
    if (isZigInstalled(version)) {
        console.log(`✅ Zig ${version} already installed`);
        return;
    }

    console.log(`📥 Downloading Zig ${version}...`);

    const url = getZigDownloadUrl(version);
    const installPath = getZigInstallPath(version);

    // Create install directory
    if (!existsSync(installPath)) {
        mkdirSync(installPath, { recursive: true });
    }

    try {
        // Download and extract using platform-appropriate tools
        const { platform, ext } = detectPlatform();

        if (platform === 'windows') {
            // Windows: Download .zip and extract with PowerShell
            const tempFile = join(installPath, `zig-${version}.zip`);
            
            // Download using PowerShell (more reliable than curl on Windows)
            console.log(`📥 Downloading ${url}...`);
            execSync(`powershell -Command "(New-Object System.Net.WebClient).DownloadFile('${url}', '${tempFile}')"`, { stdio: 'inherit' });

            // Extract using PowerShell
            console.log(`📦 Extracting Zig ${version}...`);
            execSync(`powershell -Command "Expand-Archive -Path '${tempFile}' -DestinationPath '${installPath}' -Force"`, { stdio: 'inherit' });

            // Remove temp file
            execSync(`del "${tempFile}"`, { stdio: 'inherit' });
        } else {
            // Unix-like: Download .tar.xz and extract with curl + tar
            const tempFile = join(installPath, `zig-${version}.tar.xz`);
            execSync(`curl -fSL "${url}" -o "${tempFile}"`, { stdio: 'inherit' });

            // Extract
            console.log(`📦 Extracting Zig ${version}...`);
            execSync(`tar -xJf "${tempFile}" -C "${installPath}"`, { stdio: 'inherit' });

            // Remove temp file
            execSync(`rm "${tempFile}"`);
        }

        // Verify installation
        const binaryPath = getZigBinaryPath(version);
        if (!existsSync(binaryPath)) {
            throw new Error(`Installation failed: binary not found at ${binaryPath}`);
        }

        // Make executable
        chmodSync(binaryPath, 0o755);

        console.log(`✅ Zig ${version} installed successfully at ${binaryPath}`);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to install Zig ${version}: ${message}`);
    }
}

/**
 * Ensure a specific Zig version is installed (install if needed)
 * First checks system PATH, then falls back to downloading
 * @param version Zig version to ensure
 * @returns Absolute path to Zig binary
 */
export function ensureZig(version: ZigVersion): string {
    // Check if we already have it in cache
    if (isZigInstalled(version)) {
        return getZigBinaryPath(version);
    }

    // Check system PATH for matching version
    const systemVersion = detectSystemZig();
    if (systemVersion === version) {
        const systemPath = getSystemZigPath();
        if (systemPath) {
            console.log(`✅ Using system Zig ${version} at ${systemPath}`);
            return systemPath;
        }
    }

    // Not found in system or cache, download it
    console.log(`📥 Zig ${version} not found in system, downloading...`);
    installZig(version);
    return getZigBinaryPath(version);
}

/**
 * Get installed Zig version
 */
export function getInstalledZigVersion(binaryPath: string): string {
    try {
        const output = execSync(`"${binaryPath}" version`, { encoding: 'utf8' });
        return output.trim();
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to get Zig version: ${message}`);
    }
}

/**
 * List all installed Zig versions
 */
export function listInstalledVersions(): ZigVersion[] {
    return SUPPORTED_ZIG_VERSIONS.filter((version) => isZigInstalled(version));
}

/**
 * Install all supported Zig versions
 */
export function installAllVersions(): void {
    for (const version of SUPPORTED_ZIG_VERSIONS) {
        installZig(version);
    }
}
