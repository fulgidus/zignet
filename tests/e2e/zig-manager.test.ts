/**
 * E2E Tests for Zig Manager
 *
 * Tests multi-version support, system detection, and download functionality
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import {
    detectSystemZig,
    getSystemZigPath,
    isZigInstalled,
    getZigBinaryPath,
    ensureZig,
    SUPPORTED_ZIG_VERSIONS,
} from '../../src/zig/manager.js';

describe('Zig Manager E2E', () => {
    describe('System Detection', () => {
        it('should detect system Zig if installed', () => {
            const version = detectSystemZig();
            if (version) {
                expect(typeof version).toBe('string');
                expect(version.length).toBeGreaterThan(0);
                console.log(`✅ Detected system Zig: ${version}`);
            } else {
                console.log('ℹ️  No system Zig detected (OK for CI)');
            }
        });

        it('should get system Zig path if available', () => {
            const path = getSystemZigPath();
            if (path) {
                expect(typeof path).toBe('string');
                expect(path).toContain('zig');
                console.log(`✅ System Zig path: ${path}`);
            }
        });
    });

    describe('Version Management', () => {
        it('should export supported versions from config', () => {
            expect(Array.isArray(SUPPORTED_ZIG_VERSIONS)).toBe(true);
            expect(SUPPORTED_ZIG_VERSIONS.length).toBeGreaterThan(0);
            console.log(`✅ Supported versions: ${SUPPORTED_ZIG_VERSIONS.join(', ')}`);
        });

        it('should generate correct binary paths', () => {
            const version = SUPPORTED_ZIG_VERSIONS[0];
            const path = getZigBinaryPath(version);

            expect(path).toContain(version);
            expect(path).toContain('.zignet');

            // Platform-specific checks
            if (process.platform === 'win32') {
                expect(path).toContain('zig.exe');
            } else {
                expect(path).toMatch(/zig$/);
            }
        });
    });

    describe('Installation (skipped in CI by default)', () => {
        // This test is slow - only run if ZIGNET_TEST_INSTALL=1
        const shouldTestInstall = process.env.ZIGNET_TEST_INSTALL === '1';

        (shouldTestInstall ? it : it.skip)(
            'should install Zig version on demand',
            async () => {
                const version = SUPPORTED_ZIG_VERSIONS[0];
                const binaryPath = await ensureZig(version);

                expect(typeof binaryPath).toBe('string');
                expect(isZigInstalled(version)).toBe(true);

                console.log(`✅ Installed Zig ${version} at ${binaryPath}`);
            },
            60000
        ); // 60s timeout for download
    });
});
