/**
 * ZigNet Configuration
 *
 * Centralized configuration management based on environment variables.
 * Controls Zig versions for documentation scraping, compilation, and defaults.
 */

/**
 * Parse comma-separated Zig versions from environment variable
 */
function parseZigVersions(envVar: string | undefined, fallback: string[]): string[] {
    if (!envVar) {
        return fallback;
    }

    return envVar
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
}

/**
 * Supported Zig versions (from ZIG_SUPPORTED env var)
 * Default: "0.13.0,0.14.0,0.15.2"
 *
 * Example:
 *   export ZIG_SUPPORTED="0.13.0,0.14.0,0.15.2"
 */
export const SUPPORTED_ZIG_VERSIONS = parseZigVersions(process.env.ZIG_SUPPORTED, [
    '0.13.0',
    '0.14.0',
    '0.15.2',
]) as readonly string[];

export type ZigVersion = (typeof SUPPORTED_ZIG_VERSIONS)[number];

/**
 * Default Zig version (from ZIG_DEFAULT env var)
 * Default: "0.15.2"
 *
 * Example:
 *   export ZIG_DEFAULT="0.15.2"
 */
export const DEFAULT_ZIG_VERSION = (process.env.ZIG_DEFAULT || '0.15.2') as ZigVersion;

/**
 * Validate that default version is in supported versions
 */
if (!SUPPORTED_ZIG_VERSIONS.includes(DEFAULT_ZIG_VERSION)) {
    throw new Error(
        `ZIG_DEFAULT (${DEFAULT_ZIG_VERSION}) is not in ZIG_SUPPORTED (${SUPPORTED_ZIG_VERSIONS.join(', ')})`
    );
}

/**
 * Get configuration summary for logging
 */
export function getConfigSummary(): string {
    return `
ZigNet Configuration:
  ZIG_SUPPORTED: ${SUPPORTED_ZIG_VERSIONS.join(', ')}
  ZIG_DEFAULT: ${DEFAULT_ZIG_VERSION}
`.trim();
}

/**
 * Validate a Zig version string
 */
export function isValidZigVersion(version: string): version is ZigVersion {
    return SUPPORTED_ZIG_VERSIONS.includes(version);
}

/**
 * Get Zig version or fallback to default
 */
export function getZigVersionOrDefault(version?: string): ZigVersion {
    if (!version) {
        return DEFAULT_ZIG_VERSION;
    }

    if (isValidZigVersion(version)) {
        return version;
    }

    console.warn(`Invalid Zig version "${version}", falling back to ${DEFAULT_ZIG_VERSION}`);
    return DEFAULT_ZIG_VERSION;
}
