#!/usr/bin/env node
/**
 * CI Test Script - Compile Tool
 * Cross-platform test for compile_zig tool
 */

const { compileZig } = require('../dist/tools/compile.cjs');

// Get Zig version from command line argument
const zigVersion = process.argv[2] || process.env.ZIG_DEFAULT || '0.15.2';

// Test code: unformatted Zig code
const code = 'fn add(a:i32,b:i32)i32{return a+b;}';

console.log(`Testing compile_zig (format) with Zig ${zigVersion}...`);

compileZig({ code, zig_version: zigVersion })
    .then(result => {
        console.log('✅ Compile Result:', JSON.stringify(result.summary, null, 2));

        if (!result.success) {
            console.error('❌ Compilation failed!');
            console.error('Errors:', JSON.stringify(result.errors, null, 2));
            process.exit(1);
        }

        console.log(`✅ Test passed for Zig ${zigVersion}`);
        console.log('Formatted output:', result.output);
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Unexpected error:', err.message);
        console.error(err.stack);
        process.exit(1);
    });
