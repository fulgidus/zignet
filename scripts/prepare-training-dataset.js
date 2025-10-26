#!/usr/bin/env node
/**
 * Training Dataset Preparation
 * Merges documentation and repository datasets for fine-tuning
 * 
 * Input: 
 *   - data/zig-docs/*.json (documentation examples)
 *   - data/repos//dataset.json (repository code snippets)
    * 
 * Output:
 * - data / training / dataset - train.jsonl
    * - data / training / dataset - validation.jsonl
    * - data / training / dataset - test.jsonl
    */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DOCS_DIR = path.join(__dirname, '..', 'data', 'zig-docs');
const REPOS_DIR = path.join(__dirname, '..', 'data', 'repos');
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'training');

// Split ratios
const TRAIN_RATIO = 0.70;
const VAL_RATIO = 0.15;
const TEST_RATIO = 0.15;

// Quality thresholds
const MIN_CODE_LENGTH = 20;
const MAX_CODE_LENGTH = 2048;
const MIN_INSTRUCTION_LENGTH = 10;

/**
 * Load all documentation datasets
 */
async function loadDocsDatasets() {
    console.log('📚 Loading documentation datasets...');

    const datasets = [];
    const files = await fs.readdir(DOCS_DIR);

    for (const file of files) {
        if (file.endsWith('-dataset.json')) {
            const filePath = path.join(DOCS_DIR, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const data = JSON.parse(content);

            datasets.push(...data);
            console.log(`  ✅ Loaded ${data.length} examples from ${file}`);
        }
    }

    return datasets;
}

/**
 * Load all repository datasets recursively
 */
async function loadReposDatasets() {
    console.log('\n📦 Loading repository datasets...');

    const datasets = [];

    async function scanDirectory(dir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                await scanDirectory(fullPath);
            } else if (entry.name === 'dataset.json') {
                try {
                    const content = await fs.readFile(fullPath, 'utf-8');
                    const data = JSON.parse(content);
                    datasets.push(...data);
                    console.log(`  ✅ Loaded ${data.length} examples from ${path.relative(REPOS_DIR, fullPath)}`);
                } catch (error) {
                    console.error(`  ⚠️  Error loading ${fullPath}: ${error.message}`);
                }
            }
        }
    }

    try {
        await scanDirectory(REPOS_DIR);
    } catch (error) {
        console.warn('  ⚠️  Repos directory not found or empty');
    }

    return datasets;
}

/**
 * Generate hash for deduplication
 */
function generateHash(text) {
    return crypto.createHash('sha256').update(text.trim()).digest('hex');
}

/**
 * Normalize and validate dataset entry
 */
function normalizeEntry(entry) {
    // Extract response code (the actual Zig code)
    const code = entry.response?.trim() || '';

    // Skip if code is too short or too long
    if (code.length < MIN_CODE_LENGTH || code.length > MAX_CODE_LENGTH) {
        return null;
    }

    // Skip if instruction is too short
    const instruction = entry.instruction?.trim() || '';
    if (instruction.length < MIN_INSTRUCTION_LENGTH) {
        return null;
    }

    // Basic Zig syntax validation (must contain at least one of these)
    const hasZigSyntax = /\b(fn|const|var|pub|struct|enum|union|comptime|try|catch|error)\b/.test(code);
    if (!hasZigSyntax) {
        return null;
    }

    return {
        instruction: instruction,
        input: entry.context?.trim() || '',
        output: code,
        metadata: {
            ...entry.metadata,
            source: entry.metadata?.repo ? 'repository' : 'documentation',
        }
    };
}

/**
 * Deduplicate entries by code hash
 */
function deduplicateDataset(entries) {
    console.log('\n🔍 Deduplicating dataset...');

    const seen = new Set();
    const deduplicated = [];
    let duplicates = 0;

    for (const entry of entries) {
        const hash = generateHash(entry.output);

        if (!seen.has(hash)) {
            seen.add(hash);
            deduplicated.push(entry);
        } else {
            duplicates++;
        }
    }

    console.log(`  ✅ Removed ${duplicates} duplicates`);
    console.log(`  ✅ Kept ${deduplicated.length} unique examples`);

    return deduplicated;
}

/**
 * Balance dataset by difficulty
 */
function balanceByDifficulty(entries) {
    console.log('\n⚖️  Analyzing difficulty distribution...');

    const byDifficulty = {
        easy: [],
        medium: [],
        hard: [],
        unknown: []
    };

    for (const entry of entries) {
        const difficulty = entry.metadata?.difficulty || 'unknown';
        if (byDifficulty[difficulty]) {
            byDifficulty[difficulty].push(entry);
        } else {
            byDifficulty.unknown.push(entry);
        }
    }

    console.log(`  📊 Easy: ${byDifficulty.easy.length}`);
    console.log(`  📊 Medium: ${byDifficulty.medium.length}`);
    console.log(`  📊 Hard: ${byDifficulty.hard.length}`);
    console.log(`  📊 Unknown: ${byDifficulty.unknown.length}`);

    // Calculate target size (use median to avoid skew)
    const counts = [
        byDifficulty.easy.length,
        byDifficulty.medium.length,
        byDifficulty.hard.length
    ].filter(c => c > 0).sort((a, b) => a - b);

    const targetSize = counts.length > 0 ? counts[Math.floor(counts.length / 2)] : 0;

    if (targetSize === 0) {
        console.log('  ⚠️  Cannot balance: insufficient data');
        return entries;
    }

    console.log(`  🎯 Target size per difficulty: ${targetSize}`);

    // Balance each category
    const balanced = [];
    for (const [difficulty, items] of Object.entries(byDifficulty)) {
        if (difficulty === 'unknown') {
            balanced.push(...items); // Keep all unknown
            continue;
        }

        if (items.length > targetSize) {
            // Random sample
            const shuffled = items.sort(() => Math.random() - 0.5);
            balanced.push(...shuffled.slice(0, targetSize));
        } else {
            balanced.push(...items);
        }
    }

    console.log(`  ✅ Balanced dataset: ${balanced.length} examples`);

    return balanced;
}

/**
 * Split dataset into train/validation/test
 */
function splitDataset(entries) {
    console.log('\n✂️  Splitting dataset...');

    // Shuffle
    const shuffled = entries.sort(() => Math.random() - 0.5);

    const total = shuffled.length;
    const trainSize = Math.floor(total * TRAIN_RATIO);
    const valSize = Math.floor(total * VAL_RATIO);

    const train = shuffled.slice(0, trainSize);
    const validation = shuffled.slice(trainSize, trainSize + valSize);
    const test = shuffled.slice(trainSize + valSize);

    console.log(`  📊 Train: ${train.length} (${(train.length / total * 100).toFixed(1)}%)`);
    console.log(`  📊 Validation: ${validation.length} (${(validation.length / total * 100).toFixed(1)}%)`);
    console.log(`  📊 Test: ${test.length} (${(test.length / total * 100).toFixed(1)}%)`);

    return { train, validation, test };
}

/**
 * Convert to training format (Alpaca-style)
 */
function formatForTraining(entry) {
    return {
        instruction: entry.instruction,
        input: entry.input,
        output: entry.output,
    };
}

/**
 * Save dataset to JSONL format
 */
async function saveDataset(entries, filename) {
    const filePath = path.join(OUTPUT_DIR, filename);

    const lines = entries.map(entry => {
        const formatted = formatForTraining(entry);
        return JSON.stringify(formatted);
    });

    await fs.writeFile(filePath, lines.join('\n'), 'utf-8');
    console.log(`  💾 Saved ${entries.length} examples to ${filename}`);

    return filePath;
}

/**
 * Generate dataset statistics
 */
function generateStats(datasets) {
    const stats = {
        total: datasets.train.length + datasets.validation.length + datasets.test.length,
        train: datasets.train.length,
        validation: datasets.validation.length,
        test: datasets.test.length,
        byDifficulty: { easy: 0, medium: 0, hard: 0, unknown: 0 },
        bySource: { documentation: 0, repository: 0 },
        avgCodeLength: 0,
        avgInstructionLength: 0,
    };

    const allEntries = [...datasets.train, ...datasets.validation, ...datasets.test];

    let totalCodeLength = 0;
    let totalInstructionLength = 0;

    for (const entry of allEntries) {
        // Difficulty
        const difficulty = entry.metadata?.difficulty || 'unknown';
        if (stats.byDifficulty[difficulty] !== undefined) {
            stats.byDifficulty[difficulty]++;
        }

        // Source
        const source = entry.metadata?.source || 'unknown';
        if (stats.bySource[source] !== undefined) {
            stats.bySource[source]++;
        }

        // Lengths
        totalCodeLength += entry.output.length;
        totalInstructionLength += entry.instruction.length;
    }

    stats.avgCodeLength = Math.round(totalCodeLength / allEntries.length);
    stats.avgInstructionLength = Math.round(totalInstructionLength / allEntries.length);

    return stats;
}

/**
 * Main preparation function
 */
async function prepareTrainingDataset() {
    console.log('🚀 Starting training dataset preparation...\n');

    // Ensure output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // Load all datasets
    const docsData = await loadDocsDatasets();
    const reposData = await loadReposDatasets();

    const totalRaw = docsData.length + reposData.length;
    console.log(`\n📊 Total raw examples: ${totalRaw}`);

    // Normalize and validate
    console.log('\n🔧 Normalizing and validating...');
    const allData = [...docsData, ...reposData];
    const normalized = allData.map(normalizeEntry).filter(x => x !== null);
    console.log(`  ✅ Valid examples: ${normalized.length} (${((normalized.length / totalRaw) * 100).toFixed(1)}%)`);

    // Deduplicate
    const deduplicated = deduplicateDataset(normalized);

    // Balance by difficulty (optional - comment out if you want to keep all data)
    // const balanced = balanceByDifficulty(deduplicated);
    const balanced = deduplicated; // Keep all data for now

    // Split into train/val/test
    const datasets = splitDataset(balanced);

    // Save datasets
    console.log('\n💾 Saving datasets...');
    await saveDataset(datasets.train, 'dataset-train.jsonl');
    await saveDataset(datasets.validation, 'dataset-validation.jsonl');
    await saveDataset(datasets.test, 'dataset-test.jsonl');

    // Generate and save statistics
    const stats = generateStats(datasets);
    const statsPath = path.join(OUTPUT_DIR, 'dataset-stats.json');
    await fs.writeFile(statsPath, JSON.stringify(stats, null, 2));
    console.log(`  💾 Saved statistics to dataset-stats.json`);

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ Dataset preparation complete!');
    console.log('='.repeat(60));
    console.log(`\n📊 FINAL STATISTICS:`);
    console.log(`   Total examples: ${stats.total}`);
    console.log(`   Train: ${stats.train} (${(stats.train / stats.total * 100).toFixed(1)}%)`);
    console.log(`   Validation: ${stats.validation} (${(stats.validation / stats.total * 100).toFixed(1)}%)`);
    console.log(`   Test: ${stats.test} (${(stats.test / stats.total * 100).toFixed(1)}%)`);
    console.log(`\n📈 BY DIFFICULTY:`);
    console.log(`   Easy: ${stats.byDifficulty.easy}`);
    console.log(`   Medium: ${stats.byDifficulty.medium}`);
    console.log(`   Hard: ${stats.byDifficulty.hard}`);
    console.log(`\n📦 BY SOURCE:`);
    console.log(`   Documentation: ${stats.bySource.documentation}`);
    console.log(`   Repository: ${stats.bySource.repository}`);
    console.log(`\n📏 AVERAGES:`);
    console.log(`   Code length: ${stats.avgCodeLength} chars`);
    console.log(`   Instruction length: ${stats.avgInstructionLength} chars`);
    console.log('\n' + '='.repeat(60));
    console.log('\n🎯 NEXT STEPS:');
    console.log('   1. Review dataset-stats.json');
    console.log('   2. Check sample entries in dataset-train.jsonl');
    console.log('   3. Proceed with fine-tuning (see docs/FINE_TUNING.md)');
    console.log('='.repeat(60) + '\n');
}

// Run preparation
prepareTrainingDataset().catch(console.error);
