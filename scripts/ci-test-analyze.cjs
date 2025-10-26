#!/usr/bin/env node
/**
 * CI Test Script - Analyze Tool
 * Cross-platform test for analyze_zig tool
 */

const { analyzeZig } = require('../dist/tools/analyze.cjs');

// Get Zig version from command line argument
const zigVersion = process.argv[2] || process.env.ZIG_DEFAULT || '0.15.2';

// Test code: simple function that uses all parameters (no unused vars)
const code = 'fn add(a: i32, b: i32) i32 { return a + b; }';

console.log(`Testing analyze_zig with Zig ${zigVersion}...`);

analyzeZig({ code, zig_version: zigVersion })
    .then(result => {
        console.log('✅ Analysis Result:', JSON.stringify(result.summary, null, 2));

        if (!result.success) {
            console.error('❌ Analysis failed!');
            console.error('Errors:', JSON.stringify(result.errors, null, 2));
            process.exit(1);
        }

        console.log(`✅ Test passed for Zig ${zigVersion}`);
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Unexpected error:', err.message);
        console.error(err.stack);
        process.exit(1);
    });
