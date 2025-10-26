export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
        '/models/',
        '/data/',
    ],
    transformIgnorePatterns: [
        'node_modules/(?!(node-llama-cpp|lifecycle-utils|@llama-node)/)',
    ],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/*.test.ts',
        '!src/**/*.spec.ts',
        '!src/example.ts',
        '!src/parser-demo.ts',
        '!src/codegen-demo.ts',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html', 'json'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    verbose: true,
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^node-llama-cpp$': '<rootDir>/tests/__mocks__/node-llama-cpp.ts',
    },
    transform: {
        '^.+\\.ts$': [
            'ts-jest',
            {
                useESM: true,
                tsconfig: './tsconfig.test.json',
            },
        ],
    },
    // Timeout for E2E tests that may download Zig
    testTimeout: 30000,
};
