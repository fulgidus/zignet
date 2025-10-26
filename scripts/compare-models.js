#!/usr/bin/env node
/**
 * Model Comparison Tool
 * Analyzes all test results and provides recommendations
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESULTS_DIR = path.join(__dirname, 'test-results');

async function analyzeResults() {
    console.log('📊 ZigNet Model Comparison Tool\n');
    console.log('═'.repeat(80));

    const files = await fs.readdir(RESULTS_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const models = [];

    for (const file of jsonFiles) {
        const filePath = path.join(RESULTS_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);

        // Calculate metrics
        const totalTests = data.tests?.length || 0;
        const passedTests = data.tests?.filter(t => t.success).length || 0;
        const avgDuration = data.tests?.reduce((sum, t) => sum + (t.duration || 0), 0) / totalTests / 1000 || 0;

        // Extract model name and size
        const modelName = data.model || 'unknown';
        const modelSize = extractModelSize(modelName);

        models.push({
            name: modelName,
            size: modelSize,
            totalTests,
            passedTests,
            failedTests: totalTests - passedTests,
            passRate: ((passedTests / totalTests) * 100).toFixed(1),
            avgDuration: avgDuration.toFixed(2),
            timestamp: data.timestamp,
            file,
        });
    }

    // Sort by pass rate (desc), then by speed (asc)
    models.sort((a, b) => {
        if (b.passRate !== a.passRate) return b.passRate - a.passRate;
        return a.avgDuration - b.avgDuration;
    });

    // Display results
    console.log('\n📋 All Models (sorted by performance)\n');
    console.log('┌─────────────────────────┬──────┬──────┬──────┬─────────┬─────────┐');
    console.log('│ Model                   │ Size │ Pass │ Fail │ Rate    │ Avg Time│');
    console.log('├─────────────────────────┼──────┼──────┼──────┼─────────┼─────────┤');

    for (const model of models) {
        const name = model.name.padEnd(23);
        const size = (model.size || '-').padEnd(4);
        const pass = String(model.passedTests).padStart(4);
        const fail = String(model.failedTests).padStart(4);
        const rate = `${model.passRate}%`.padStart(7);
        const time = `${model.avgDuration}s`.padStart(7);

        console.log(`│ ${name} │ ${size} │ ${pass} │ ${fail} │ ${rate} │ ${time} │`);
    }

    console.log('└─────────────────────────┴──────┴──────┴──────┴─────────┴─────────┘');

    // Top performers
    const topModels = models.filter(m => parseFloat(m.passRate) === 100);

    if (topModels.length > 0) {
        console.log('\n🏆 Top Performers (100% Pass Rate)\n');

        for (const model of topModels.slice(0, 5)) {
            console.log(`✅ ${model.name}`);
            console.log(`   Size: ${model.size || 'N/A'} | Speed: ${model.avgDuration}s avg | Tests: ${model.passedTests}/${model.totalTests}`);
        }
    }

    // Recommendations
    console.log('\n💡 Recommendations\n');

    // Best overall (100% pass rate, fastest)
    const bestOverall = topModels[0];
    if (bestOverall) {
        console.log(`🥇 Best Overall: ${bestOverall.name}`);
        console.log(`   → 100% accuracy, ${bestOverall.avgDuration}s average response time`);
        console.log(`   → Recommended for production use\n`);
    }

    // Fastest (among 100% pass rate)
    const fastest = topModels.reduce((prev, curr) =>
        parseFloat(curr.avgDuration) < parseFloat(prev.avgDuration) ? curr : prev
        , topModels[0]);

    if (fastest && fastest !== bestOverall) {
        console.log(`⚡ Fastest: ${fastest.name}`);
        console.log(`   → ${fastest.avgDuration}s average (vs ${bestOverall.avgDuration}s for best overall)`);
        console.log(`   → Best for low-latency requirements\n`);
    }

    // Smallest (among 100% pass rate)
    const smallest = topModels.reduce((prev, curr) => {
        const prevSize = parseModelSize(prev.size);
        const currSize = parseModelSize(curr.size);
        return currSize < prevSize ? curr : prev;
    }, topModels[0]);

    if (smallest && smallest !== bestOverall) {
        console.log(`📦 Smallest: ${smallest.name}`);
        console.log(`   → ${smallest.size} model size`);
        console.log(`   → Best for memory-constrained environments\n`);
    }

    // For fine-tuning
    console.log('🎯 For Fine-Tuning:\n');
    console.log('   Consider these factors:');
    console.log('   1. Base model quality (100% pass rate)');
    console.log('   2. Model size (7B is good balance)');
    console.log('   3. Community support & documentation');
    console.log('   4. Fine-tuning tooling availability\n');

    if (topModels.length > 0) {
        const recommended = topModels.find(m => m.size === '7B') || topModels[0];
        console.log(`   ✅ Recommended base: ${recommended.name}`);
        console.log(`   → Upload target: fulgidus/zignet-${recommended.name.split(':')[0]}\n`);
    }

    // Size categories
    console.log('\n📊 By Model Size\n');
    const bySize = models.reduce((acc, model) => {
        const size = model.size || 'Unknown';
        if (!acc[size]) acc[size] = [];
        acc[size].push(model);
        return acc;
    }, {});

    for (const [size, sizeModels] of Object.entries(bySize).sort()) {
        const avgPass = (sizeModels.reduce((sum, m) => sum + parseFloat(m.passRate), 0) / sizeModels.length).toFixed(1);
        const avgTime = (sizeModels.reduce((sum, m) => sum + parseFloat(m.avgDuration), 0) / sizeModels.length).toFixed(2);
        console.log(`   ${size}: ${sizeModels.length} model(s) | Avg: ${avgPass}% pass, ${avgTime}s`);
    }

    // Dataset stats
    console.log('\n\n📦 Dataset Status\n');
    console.log('═'.repeat(80));

    try {
        const statsPath = path.join(__dirname, '..', 'data', 'zig-docs', 'dataset-stats.json');
        const stats = JSON.parse(await fs.readFile(statsPath, 'utf-8'));

        console.log(`\n✅ Total Training Examples: ${stats.totalExamples.toLocaleString()}`);
        console.log('\n📚 By Zig Version:');
        for (const [version, count] of Object.entries(stats.byVersion || {}).sort()) {
            const pct = ((count / stats.totalExamples) * 100).toFixed(1);
            console.log(`   ${version}: ${count.toLocaleString()} (${pct}%)`);
        }

        console.log('\n🎯 By Difficulty:');
        for (const [diff, count] of Object.entries(stats.byDifficulty || {}).sort()) {
            const pct = ((count / stats.totalExamples) * 100).toFixed(1);
            console.log(`   ${diff}: ${count.toLocaleString()} (${pct}%)`);
        }

        console.log('\n📖 Top Topics:');
        const topTopics = Object.entries(stats.byTopic || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        for (const [topic, count] of topTopics) {
            console.log(`   ${topic}: ${count}`);
        }
    } catch (err) {
        console.log('\n⚠️  Dataset stats not found. Run: pnpm run scrape-docs');
    }

    console.log('\n═'.repeat(80));
    console.log('\n✅ Analysis complete!\n');
}

function extractModelSize(modelName) {
    const match = modelName.match(/(\d+\.?\d*)b/i);
    if (match) {
        const size = parseFloat(match[1]);
        if (size >= 1) return `${size}B`;
        return `${(size * 1000).toFixed(0)}M`;
    }
    return null;
}

function parseModelSize(sizeStr) {
    if (!sizeStr) return Infinity;
    const match = sizeStr.match(/(\d+\.?\d*)([BM])/);
    if (!match) return Infinity;
    const num = parseFloat(match[1]);
    return match[2] === 'B' ? num : num / 1000;
}

analyzeResults().catch(console.error);
