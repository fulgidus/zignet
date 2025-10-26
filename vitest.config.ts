import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // Test environment
        environment: 'node',

        // Test files
        include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
        exclude: ['node_modules', 'dist', 'models', 'data'],

        // Coverage configuration
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov', 'html', 'json'],
            reportsDirectory: './coverage',
            include: ['src/**/*.ts'],
            exclude: [
                'src/**/*.d.ts',
                'src/**/*.test.ts',
                'src/**/*.spec.ts',
                'src/example.ts',
                'src/parser-demo.ts',
                'src/codegen-demo.ts',
            ],
        },

        // Timeouts
        testTimeout: 30000, // 30s for E2E tests with Zig downloads
        hookTimeout: 30000,

        // Globals (for Jest compatibility)
        globals: true,

        // TypeScript support
        typecheck: {
            enabled: false, // Can enable for stricter type checking
        },

        // Reporter
        reporters: ['verbose'],
    },
});
