#!/usr/bin/env node
/**
 * Zig Documentation Scraper
 * Downloads and processes Zig language reference for fine-tuning dataset
 * 
 * Target: https://ziglang.org/documentation/0.15.0/
 * Output: JSON dataset for model fine-tuning
 */

import https from 'https';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file (if needed in future)
config({ path: path.join(__dirname, '..', '.env') });

// Configuration
const ZIG_VERSIONS = ['0.15.1', '0.14.1', '0.13.0']; // Support last 4 versions
const BASE_URL = 'https://ziglang.org/documentation';
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'zig-docs');
const CHUNK_SIZE = 4096; // Max tokens per chunk for training

/**
 * Download HTML content from URL
 */
async function downloadPage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(data);
                } else {
                    reject(new Error(`HTTP ${res.statusCode} for ${url}`));
                }
            });

            res.on('error', reject);
        });
    });
}

/**
 * Parse HTML and extract code examples + explanations
 */
function parseZigDocs(html) {
    const sections = [];

    // Simple regex-based extraction (can be improved with cheerio/jsdom if needed)
    // Extract sections between <h2> tags
    const sectionRegex = /<h2[^>]*>(.*?)<\/h2>(.*?)(?=<h2|$)/gs;
    let match;

    while ((match = sectionRegex.exec(html)) !== null) {
        const title = match[1].replace(/<[^>]+>/g, '').trim();
        const content = match[2];

        // Extract code blocks
        const codeRegex = /<pre><code[^>]*>(.*?)<\/code><\/pre>/gs;
        const codes = [];
        let codeMatch;

        while ((codeMatch = codeRegex.exec(content)) !== null) {
            const code = codeMatch[1]
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .trim();

            if (code.length > 10) { // Skip empty blocks
                codes.push(code);
            }
        }

        // Extract text (remove HTML tags)
        const text = content
            .replace(/<pre>.*?<\/pre>/gs, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        if (codes.length > 0 || text.length > 50) {
            sections.push({
                title,
                text: text.substring(0, 1000), // Limit text length
                examples: codes,
            });
        }
    }

    return sections;
}

/**
 * Convert sections to training dataset format
 */
function createTrainingDataset(sections, version) {
    const dataset = [];

    for (const section of sections) {
        // Create instruction-response pairs
        for (const example of section.examples) {
            dataset.push({
                instruction: `Write Zig ${version} code for: ${section.title}`,
                context: section.text.substring(0, 500),
                response: example,
                metadata: {
                    version,
                    topic: section.title,
                    difficulty: estimateDifficulty(example),
                },
            });
        }

        // Add Q&A pairs
        if (section.text.length > 100) {
            dataset.push({
                instruction: `Explain ${section.title} in Zig ${version}`,
                context: '',
                response: section.text,
                metadata: {
                    version,
                    topic: section.title,
                    type: 'explanation',
                },
            });
        }
    }

    return dataset;
}

/**
 * Estimate code difficulty based on features
 */
function estimateDifficulty(code) {
    const features = {
        comptime: /comptime/.test(code),
        generics: /<[A-Z]>/.test(code),
        errorHandling: /error|try|catch/.test(code),
        pointers: /\*[a-z]|\[\*\]/.test(code),
        async: /async|await/.test(code),
    };

    const score = Object.values(features).filter(Boolean).length;

    if (score >= 3) return 'hard';
    if (score >= 1) return 'medium';
    return 'easy';
}

/**
 * Main scraping function
 */
async function scrapeZigDocs() {
    console.log('🚀 Starting Zig documentation scraper...\n');

    // Ensure output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    const allData = [];

    for (const version of ZIG_VERSIONS) {
        console.log(`📥 Downloading Zig ${version} documentation...`);
        const url = `${BASE_URL}/${version}/`;

        try {
            const html = await downloadPage(url);
            console.log(`✅ Downloaded ${(html.length / 1024).toFixed(2)} KB`);

            // Save raw HTML
            const htmlPath = path.join(OUTPUT_DIR, `zig-${version}-raw.html`);
            await fs.writeFile(htmlPath, html);
            console.log(`💾 Saved raw HTML: ${htmlPath}`);

            // Parse and extract
            console.log(`🔍 Parsing documentation...`);
            const sections = parseZigDocs(html);
            console.log(`✅ Extracted ${sections.length} sections`);

            // Create training dataset
            const dataset = createTrainingDataset(sections, version);
            console.log(`✅ Created ${dataset.length} training examples`);

            // Save dataset
            const datasetPath = path.join(OUTPUT_DIR, `zig-${version}-dataset.json`);
            await fs.writeFile(datasetPath, JSON.stringify(dataset, null, 2));
            console.log(`💾 Saved dataset: ${datasetPath}\n`);

            allData.push(...dataset);
        } catch (error) {
            console.error(`❌ Error processing ${version}:`, error.message);
        }
    }

    // Save combined dataset
    const combinedPath = path.join(OUTPUT_DIR, 'zig-combined-dataset.json');
    await fs.writeFile(combinedPath, JSON.stringify(allData, null, 2));
    console.log(`\n✅ Total training examples: ${allData.length}`);
    console.log(`💾 Combined dataset: ${combinedPath}`);

    // Generate statistics
    const stats = {
        totalExamples: allData.length,
        byVersion: {},
        byDifficulty: { easy: 0, medium: 0, hard: 0 },
        byTopic: {},
    };

    for (const item of allData) {
        const { version } = item.metadata;
        stats.byVersion[version] = (stats.byVersion[version] || 0) + 1;

        if (item.metadata.difficulty) {
            stats.byDifficulty[item.metadata.difficulty]++;
        }

        const topic = item.metadata.topic;
        stats.byTopic[topic] = (stats.byTopic[topic] || 0) + 1;
    }

    const statsPath = path.join(OUTPUT_DIR, 'dataset-stats.json');
    await fs.writeFile(statsPath, JSON.stringify(stats, null, 2));
    console.log(`📊 Statistics: ${statsPath}`);

    console.log('\n✅ Scraping complete!');
}

// Run scraper
scrapeZigDocs().catch(console.error);
