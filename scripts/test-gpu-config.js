#!/usr/bin/env node

/**
 * Test script to verify GPU device configuration
 * 
 * Usage:
 *   node scripts/test-gpu-config.js
 *   ZIGNET_GPU_DEVICE=0 node scripts/test-gpu-config.js
 *   ZIGNET_GPU_DEVICE=1 node scripts/test-gpu-config.js
 */

console.log('🧪 Testing GPU Device Configuration\n');

// Test 1: Read config
console.log('📋 Configuration Test:');
import('../dist/config.js').then((config) => {
    console.log('   GPU_DEVICE:', config.GPU_DEVICE || 'auto (all available GPUs)');
    console.log('   GPU_LAYERS:', config.GPU_LAYERS);
    console.log('   MODEL_PATH:', config.MODEL_PATH);
    console.log();

    console.log('📊 Full Configuration Summary:');
    console.log(config.getConfigSummary());
    console.log();

    // Test 2: Check CUDA_VISIBLE_DEVICES would be set correctly
    console.log('🎯 GPU Selection Logic:');
    if (config.GPU_DEVICE) {
        console.log(`   ✅ CUDA_VISIBLE_DEVICES will be set to: ${config.GPU_DEVICE}`);
        console.log('   ℹ️  This means only the specified GPU(s) will be visible to CUDA');
    } else {
        console.log('   ℹ️  CUDA_VISIBLE_DEVICES not set (default behavior)');
        console.log('   ℹ️  All available CUDA GPUs will be used');
    }
    console.log();

    // Test 3: Show how to configure
    console.log('⚙️  Configuration Examples:');
    console.log('   Use GPU 0 only:');
    console.log('      export ZIGNET_GPU_DEVICE="0"');
    console.log('      npx -y zignet');
    console.log();
    console.log('   Use GPU 1 only:');
    console.log('      export ZIGNET_GPU_DEVICE="1"');
    console.log('      npx -y zignet');
    console.log();
    console.log('   Use multiple GPUs:');
    console.log('      export ZIGNET_GPU_DEVICE="0,1"');
    console.log('      npx -y zignet');
    console.log();

    console.log('✅ Configuration test complete!');
}).catch((error) => {
    console.error('❌ Error loading config:', error);
    process.exit(1);
});
