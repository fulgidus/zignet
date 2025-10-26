#!/usr/bin/env node
/**
 * Zig Repository Scraper
 * Downloads Zig code from GitHub repositories for fine-tuning dataset
 * 
 * Target: GitHub repos with language:Zig and stars >= 1
 * Output: JSON dataset organized by repository
 */

import https from 'https';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
config({ path: path.join(__dirname, '..', '.env') });

// Configuration
const GITHUB_API = 'https://api.github.com';
const MIN_STARS = 1;
const MAX_REPOS = 50; // Limit to avoid rate limiting
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'repos');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''; // Optional: set for higher rate limits

// Rate limiting configuration
const RATE_LIMIT_BUFFER = 5; // Keep 5 requests as buffer
const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 2000; // 2 seconds
const MAX_BACKOFF = 60000; // 60 seconds

// Request tracking
let remainingRequests = GITHUB_TOKEN ? 5000 : 60;
let resetTime = null;

// File patterns to include/exclude
const INCLUDE_PATTERNS = ['.zig'];
const EXCLUDE_PATTERNS = ['test', 'vendor', 'zig-out', 'zig-cache', 'build_'];

/**
 * Wait for rate limit reset
 */
async function waitForRateLimit() {
    if (!resetTime) {
        console.log('⏳ Rate limit info not available, waiting 60 seconds...');
        await new Promise(resolve => setTimeout(resolve, 60000));
        return;
    }

    const now = Date.now();
    const waitMs = Math.max(0, resetTime - now + 1000); // Add 1 second buffer
    const waitMinutes = Math.ceil(waitMs / 60000);

    console.log(`⏳ Rate limit exceeded. Waiting ${waitMinutes} minutes until reset...`);
    console.log(`   Reset time: ${new Date(resetTime).toLocaleTimeString()}`);

    await new Promise(resolve => setTimeout(resolve, waitMs));

    // Reset counters
    remainingRequests = GITHUB_TOKEN ? 5000 : 60;
    console.log('✅ Rate limit reset. Resuming...\n');
}

/**
 * Check rate limit before making request
 */
async function checkRateLimit() {
    if (remainingRequests <= RATE_LIMIT_BUFFER) {
        console.log(`⚠️  Only ${remainingRequests} requests remaining. Waiting for reset...`);
        await waitForRateLimit();
    }
}

/**
 * Make authenticated GitHub API request with retry logic
 */
async function githubRequest(endpoint, options = {}, retryCount = 0, useAuth = true) {
    // Check rate limit before request
    await checkRateLimit();

    const url = endpoint.startsWith('http') ? endpoint : `${GITHUB_API}${endpoint}`;

    return new Promise((resolve, reject) => {
        const headers = {
            'User-Agent': 'ZigNet-Scraper',
            'Accept': 'application/vnd.github.v3+json',
        };

        if (GITHUB_TOKEN && useAuth) {
            // GitHub supports two token formats:
            // - Classic tokens: use "token" prefix
            // - Fine-grained tokens: use "Bearer" prefix
            const authPrefix = GITHUB_TOKEN.startsWith('github_pat_') ? 'Bearer' : 'token';
            headers['Authorization'] = `${authPrefix} ${GITHUB_TOKEN}`;
        }

        const urlObj = new URL(url);
        const requestOptions = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            headers,
            ...options,
        };

        https.get(requestOptions, (res) => {
            let data = '';

            // Update rate limit info from headers
            if (res.headers['x-ratelimit-remaining']) {
                remainingRequests = parseInt(res.headers['x-ratelimit-remaining']);
            }
            if (res.headers['x-ratelimit-reset']) {
                resetTime = parseInt(res.headers['x-ratelimit-reset']) * 1000;
            }

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', async () => {
                if (res.statusCode === 200) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve(data);
                    }
                } else if (res.statusCode === 403 && res.headers['x-ratelimit-remaining'] === '0') {
                    // Rate limit exceeded - wait and retry
                    console.log(`⚠️  Rate limit hit (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);

                    if (retryCount < MAX_RETRIES) {
                        await waitForRateLimit();
                        try {
                            const result = await githubRequest(endpoint, options, retryCount + 1, useAuth);
                            resolve(result);
                        } catch (error) {
                            reject(error);
                        }
                    } else {
                        reject(new Error('Rate limit exceeded after max retries'));
                    }
                } else if (res.statusCode === 404) {
                    // Not found - don't retry
                    resolve(null);
                } else if (res.statusCode >= 500 && retryCount < MAX_RETRIES) {
                    // Server error - retry with exponential backoff
                    const backoff = Math.min(INITIAL_BACKOFF * Math.pow(2, retryCount), MAX_BACKOFF);
                    console.log(`⚠️  Server error ${res.statusCode}. Retrying in ${backoff / 1000}s...`);

                    await new Promise(resolve => setTimeout(resolve, backoff));

                    try {
                        const result = await githubRequest(endpoint, options, retryCount + 1, useAuth);
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode} for ${url}`));
                }
            });

            res.on('error', reject);
        }).on('error', reject);
    });
}/**
 * Search GitHub for Zig repositories
 */
async function searchZigRepos(minStars = MIN_STARS, maxRepos = MAX_REPOS) {
    console.log(`🔍 Searching GitHub for Zig repos (min stars: ${minStars})...`);
    console.log(`   Rate limit: ${remainingRequests} requests remaining\n`);

    const repos = [];
    let page = 1;
    const perPage = 30;

    while (repos.length < maxRepos) {
        const query = `language:Zig stars:>=${minStars}`;
        const endpoint = `/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${perPage}&page=${page}`;

        try {
            const data = await githubRequest(endpoint, {}, 0, false); // No auth for public search

            if (!data || !data.items || data.items.length === 0) {
                break;
            }

            for (const repo of data.items) {
                repos.push({
                    name: repo.name,
                    fullName: repo.full_name,
                    owner: repo.owner.login,
                    stars: repo.stargazers_count,
                    description: repo.description,
                    url: repo.html_url,
                    defaultBranch: repo.default_branch,
                });

                if (repos.length >= maxRepos) break;
            }

            console.log(`  ✅ Found ${repos.length} repos (page ${page}) [${remainingRequests} requests left]`);
            page++;

            // Rate limiting: wait 1 second between search requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`  ❌ Error searching repos:`, error.message);

            if (error.message.includes('Rate limit')) {
                // Will be handled by retry logic
                continue;
            } else {
                break;
            }
        }
    }

    return repos;
}

/**
 * Get repository file tree
 */
async function getRepoTree(owner, repo, branch = 'main') {
    console.log(`  📁 Fetching file tree for ${owner}/${repo}... [${remainingRequests} requests left]`);

    try {
        const endpoint = `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
        const data = await githubRequest(endpoint);

        if (!data || !data.tree) {
            // Try 'master' branch if 'main' fails
            if (branch === 'main') {
                return getRepoTree(owner, repo, 'master');
            }
            console.log(`  ⚠️  No tree data found for ${owner}/${repo}`);
            return [];
        }

        return data.tree;
    } catch (error) {
        console.error(`  ⚠️  Error fetching tree: ${error.message}`);
        return [];
    }
}/**
 * Download file content from GitHub
 */
async function downloadFile(owner, repo, path) {
    const endpoint = `/repos/${owner}/${repo}/contents/${path}`;

    try {
        const data = await githubRequest(endpoint);

        if (data.content && data.encoding === 'base64') {
            return Buffer.from(data.content, 'base64').toString('utf-8');
        }

        return '';
    } catch (error) {
        if (!error.message.includes('Rate limit')) {
            console.error(`  ⚠️  Error downloading ${path}: ${error.message}`);
        }
        return '';
    }
}

/**
 * Filter files by pattern
 */
function shouldIncludeFile(filePath) {
    // Must be .zig file
    if (!INCLUDE_PATTERNS.some(pattern => filePath.endsWith(pattern))) {
        return false;
    }

    // Exclude test/vendor/build files
    const lowerPath = filePath.toLowerCase();
    if (EXCLUDE_PATTERNS.some(pattern => lowerPath.includes(pattern))) {
        return false;
    }

    return true;
}

/**
 * Extract code snippets from Zig file
 */
function extractCodeSnippets(code, filePath) {
    const snippets = [];

    // Extract top-level functions
    const fnRegex = /(?:pub\s+)?fn\s+(\w+)\s*\([^)]*\)[^{]*\{[^}]*\}/gs;
    let match;

    while ((match = fnRegex.exec(code)) !== null) {
        const snippet = match[0].trim();
        if (snippet.length > 50 && snippet.length < 2000) {
            snippets.push({
                type: 'function',
                name: match[1],
                code: snippet,
                file: filePath,
            });
        }
    }

    // Extract structs
    const structRegex = /(?:pub\s+)?const\s+(\w+)\s*=\s*struct\s*\{[^}]*\}/gs;
    while ((match = structRegex.exec(code)) !== null) {
        const snippet = match[0].trim();
        if (snippet.length > 30 && snippet.length < 1500) {
            snippets.push({
                type: 'struct',
                name: match[1],
                code: snippet,
                file: filePath,
            });
        }
    }

    // Extract const declarations
    const constRegex = /(?:pub\s+)?const\s+(\w+):\s*[^=]+=\s*[^;]+;/g;
    while ((match = constRegex.exec(code)) !== null) {
        const snippet = match[0].trim();
        if (snippet.length > 20 && snippet.length < 500) {
            snippets.push({
                type: 'const',
                name: match[1],
                code: snippet,
                file: filePath,
            });
        }
    }

    return snippets;
}

/**
 * Create training dataset from code snippets
 */
function createTrainingDataset(snippets, repoInfo) {
    const dataset = [];

    for (const snippet of snippets) {
        // Create instruction-response pair
        const instruction = `Write a Zig ${snippet.type} similar to ${snippet.name} from ${repoInfo.fullName}`;
        const context = `Repository: ${repoInfo.fullName} (${repoInfo.stars} ⭐)\nFile: ${snippet.file}`;

        dataset.push({
            instruction,
            context,
            response: snippet.code,
            metadata: {
                repo: repoInfo.fullName,
                stars: repoInfo.stars,
                file: snippet.file,
                type: snippet.type,
                name: snippet.name,
                difficulty: estimateDifficulty(snippet.code),
            },
        });
    }

    return dataset;
}

/**
 * Estimate code difficulty
 */
function estimateDifficulty(code) {
    const features = {
        comptime: /comptime/.test(code),
        generics: /anytype|@Type|@typeInfo/.test(code),
        errorHandling: /![\w.]+|try|catch|errdefer/.test(code),
        pointers: /\*[a-z]|\[\*\]|\[_\]/.test(code),
        async: /async|await|suspend|resume/.test(code),
        allocator: /Allocator|alloc|free/.test(code),
    };

    const score = Object.values(features).filter(Boolean).length;

    if (score >= 4) return 'hard';
    if (score >= 2) return 'medium';
    return 'easy';
}

/**
 * Process a single repository
 */
async function processRepository(repoInfo) {
    console.log(`\n📦 Processing: ${repoInfo.fullName} (${repoInfo.stars} ⭐)`);

    const repoDir = path.join(OUTPUT_DIR, repoInfo.owner, repoInfo.name);
    await fs.mkdir(repoDir, { recursive: true });

    // Get file tree
    const tree = await getRepoTree(repoInfo.owner, repoInfo.name, repoInfo.defaultBranch);
    const zigFiles = tree.filter(item => item.type === 'blob' && shouldIncludeFile(item.path));

    console.log(`  ✅ Found ${zigFiles.length} Zig files`);

    if (zigFiles.length === 0) {
        console.log(`  ⏭️  Skipping (no relevant files)`);
        return { repoInfo, examples: 0 };
    }

    // Limit files per repo to avoid rate limiting
    const filesToProcess = zigFiles.slice(0, 20);
    const allSnippets = [];

    for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        console.log(`  📄 Processing: ${file.path} (${i + 1}/${filesToProcess.length}) [${remainingRequests} requests left]`);

        const content = await downloadFile(repoInfo.owner, repoInfo.name, file.path);

        if (!content) continue;

        const snippets = extractCodeSnippets(content, file.path);
        allSnippets.push(...snippets);

        // Rate limiting: wait 800ms between files (safer for free tier)
        await new Promise(resolve => setTimeout(resolve, 800));
    }

    console.log(`  ✅ Extracted ${allSnippets.length} code snippets`);

    // Create training dataset
    const dataset = createTrainingDataset(allSnippets, repoInfo);

    // Save dataset
    const datasetPath = path.join(repoDir, 'dataset.json');
    await fs.writeFile(datasetPath, JSON.stringify(dataset, null, 2));
    console.log(`  💾 Saved: ${datasetPath}`);

    // Save repo info
    const infoPath = path.join(repoDir, 'repo-info.json');
    await fs.writeFile(infoPath, JSON.stringify(repoInfo, null, 2));

    return { repoInfo, examples: dataset.length };
}

/**
 * Main scraping function
 */
async function scrapeZigRepos() {
    console.log('🚀 Starting Zig repository scraper...\n');

    if (!GITHUB_TOKEN) {
        console.warn('⚠️  WARNING: No GITHUB_TOKEN set. Rate limits: 60 requests/hour');
        console.warn('   Set GITHUB_TOKEN env var for 5000 requests/hour');
        console.warn('   Create token at: https://github.com/settings/tokens');
        console.warn('   Required scope: public_repo (read-only)\n');
        console.warn('💡 The script will automatically wait when rate limit is reached.\n');
    } else {
        console.log('✅ Using GitHub token. Rate limits: 5000 requests/hour\n');
    }

    // Ensure output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // Search for repositories
    const repos = await searchZigRepos(MIN_STARS, MAX_REPOS);
    console.log(`\n✅ Found ${repos.length} repositories\n`);

    // Process each repository
    const results = [];
    let totalExamples = 0;

    for (const repo of repos) {
        try {
            const result = await processRepository(repo);
            results.push(result);
            totalExamples += result.examples;

            // Rate limiting between repos (longer wait for safety)
            await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (error) {
            console.error(`❌ Error processing ${repo.fullName}:`, error.message);

            // Don't stop on rate limit - retry logic handles it
            if (error.message.includes('max retries')) {
                console.log('\n⏸️  Max retries exceeded. Saving progress and stopping...');
                break;
            }
        }
    }

    // Generate summary
    const summary = {
        timestamp: new Date().toISOString(),
        totalRepos: results.length,
        totalExamples,
        repositories: results.map(r => ({
            name: r.repoInfo.fullName,
            stars: r.repoInfo.stars,
            examples: r.examples,
        })),
    };

    const summaryPath = path.join(OUTPUT_DIR, 'scraping-summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('✅ Scraping complete!');
    console.log(`📊 Repositories processed: ${results.length}`);
    console.log(`📝 Total training examples: ${totalExamples}`);
    console.log(`💾 Summary: ${summaryPath}`);
    console.log('='.repeat(60) + '\n');
}

// Run scraper
scrapeZigRepos().catch(console.error);
