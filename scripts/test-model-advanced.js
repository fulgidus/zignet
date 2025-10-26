#!/usr/bin/env node

// test-model-advanced.js
// Advanced Zig Code Testing with REAL-TIME STREAMING OUTPUT

import http from 'http';
import fs from 'fs';
import path from 'path';


const MODEL = process.argv[2] || 'phi';
const OLLAMA_HOST = 'localhost';
const OLLAMA_PORT = 11434;
const TIMEOUT_MS = 600000; // 10 minutes per test

// Color codes for terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(color, ...args) {
  console.log(`${colors[color]}${args.join(' ')}${colors.reset}`);
}

function logHeader(text) {
  log('cyan', `\n${'═'.repeat(70)}`);
  log('bright', `  ${text}`);
  log('cyan', `${'═'.repeat(70)}\n`);
}

function logTest(name, difficulty) {
  log('blue', `\n⏳ [${difficulty}] ${name}`);
}

function logProgress(message) {
  log('dim', `   → ${message}`);
}

function logSuccess(message) {
  log('green', `   ✅ ${message}`);
}

function logError(message) {
  log('red', `   ❌ ${message}`);
}

function logResponse(text) {
  log('yellow', `   📝 Response:\n${text.split('\n').map(l => `      ${l}`).join('\n')}`);
}

// Stream response from Ollama
function queryOllama(prompt, testName) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: MODEL,
      prompt: prompt,
      stream: true,
    });

    const options = {
      hostname: OLLAMA_HOST,
      port: OLLAMA_PORT,
      path: '/api/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: TIMEOUT_MS,
    };

    let fullResponse = '';
    let lastDotTime = Date.now();
    let dotCount = 0;

    const req = http.request(options, (res) => {
      log('magenta', `   🔄 Status: ${res.statusCode}`);

      let buffer = '';
      res.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line

        lines.forEach((line) => {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (data.response) {
                fullResponse += data.response;
                
                // Progress indicator every 5 seconds
                if (Date.now() - lastDotTime > 5000) {
                  process.stdout.write(colors.dim + '.' + colors.reset);
                  lastDotTime = Date.now();
                  dotCount++;
                }
              }
              
              if (data.done) {
                if (dotCount > 0) process.stdout.write('\n');
                logSuccess(`Completed in ${(data.total_duration / 1e9).toFixed(2)}s`);
                logSuccess(`Tokens: ${data.eval_count} @ ${(data.eval_count / (data.total_duration / 1e9)).toFixed(0)} tok/s`);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        });
      });

      res.on('end', () => {
        if (buffer.trim()) {
          try {
            const data = JSON.parse(buffer);
            if (data.response) {
              fullResponse += data.response;
            }
          } catch (e) {
            // Ignore
          }
        }
        
        // Show response (first 300 chars)
        const preview = fullResponse.substring(0, 300).replace(/\n/g, ' ');
        logProgress(`Response preview: "${preview}${fullResponse.length > 300 ? '...' : ''}"`);
        
        resolve(fullResponse);
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout after ${TIMEOUT_MS}ms`));
    });

    req.write(postData);
    req.end();
  });
}

// Test suite
const TESTS = [
  {
    name: 'Basic Zig Syntax',
    difficulty: 'EASY',
    prompt: `Generate a simple Zig function that returns the sum of two integers. Include the function signature and implementation only.`,
  },
  {
    name: 'Memory Allocation',
    difficulty: 'EASY',
    prompt: `Write Zig code that allocates memory using an allocator and stores an integer. Show how to free it.`,
  },
  {
    name: 'Error Handling',
    difficulty: 'MEDIUM',
    prompt: `Show a Zig function that returns a Result type with either a success value or an error. Include error handling in the caller.`,
  },
  {
    name: 'Structs & Methods',
    difficulty: 'MEDIUM',
    prompt: `Create a Zig struct for a Point with x,y coordinates and a method to calculate distance from origin.`,
  },
  {
    name: 'Generics',
    difficulty: 'HARD',
    prompt: `Write a generic Zig function that works with any numeric type and returns the maximum of two values.`,
  },
  {
    name: 'Comptime Magic',
    difficulty: 'HARD',
    prompt: `Show how to use comptime in Zig to compute a factorial at compile time. Include the function and its usage.`,
  },
];

// Save results
function saveResults(results) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `advanced-test-${MODEL.replace(/:/g, '-')}-${timestamp}`;
  
  // Save JSON
  fs.writeFileSync(
    path.join(process.cwd(), `${filename}.json`),
    JSON.stringify(results, null, 2)
  );
  
  // Save Markdown report
  let md = `# Advanced Zig Test Report\n\n`;
  md += `**Model**: ${MODEL}\n`;
  md += `**Date**: ${new Date().toISOString()}\n`;
  md += `**Total Tests**: ${results.tests.length}\n`;
  md += `**Passed**: ${results.passed}\n`;
  md += `**Failed**: ${results.failed}\n`;
  md += `**Average Response Time**: ${(results.avgResponseTime / 1000).toFixed(2)}s\n\n`;
  
  md += `## Results\n\n`;
  results.tests.forEach((test, idx) => {
    md += `### ${idx + 1}. ${test.name} [${test.difficulty}]\n\n`;
    md += `**Status**: ${test.success ? '✅ PASS' : '❌ FAIL'}\n`;
    md += `**Time**: ${(test.duration / 1000).toFixed(2)}s\n`;
    if (test.error) md += `**Error**: ${test.error}\n`;
    md += `**Response**:\n\`\`\`zig\n${test.response}\n\`\`\`\n\n`;
  });
  
  fs.writeFileSync(
    path.join(process.cwd(), `${filename}.md`),
    md
  );
  
  log('green', `\n📁 Results saved:`);
  log('green', `   - ${filename}.json`);
  log('green', `   - ${filename}.md`);
}

// Main test runner
async function runTests() {
  logHeader(`🚀 Advanced Zig Model Tester`);
  log('cyan', `📅 ${new Date().toISOString()}`);
  log('cyan', `🖥️  Model: ${MODEL}`);
  log('cyan', `📊 Tests: ${TESTS.length}`);
  
  const results = {
    model: MODEL,
    timestamp: new Date().toISOString(),
    tests: [],
    passed: 0,
    failed: 0,
    avgResponseTime: 0,
  };

  let totalTime = 0;

  for (let i = 0; i < TESTS.length; i++) {
    const test = TESTS[i];
    logTest(`[${i + 1}/${TESTS.length}] ${test.name}`, test.difficulty);
    
    const startTime = Date.now();
    
    try {
      logProgress('Querying model...');
      const response = await queryOllama(test.prompt, test.name);
      
      const duration = Date.now() - startTime;
      totalTime += duration;
      
      logSuccess(`Test completed`);
      
      results.tests.push({
        id: i + 1,
        name: test.name,
        difficulty: test.difficulty,
        prompt: test.prompt,
        response: response.substring(0, 500),
        duration: duration,
        success: true,
      });
      
      results.passed++;
    } catch (error) {
      const duration = Date.now() - startTime;
      totalTime += duration;
      
      logError(`${error.message}`);
      
      results.tests.push({
        id: i + 1,
        name: test.name,
        difficulty: test.difficulty,
        prompt: test.prompt,
        response: '',
        duration: duration,
        success: false,
        error: error.message,
      });
      
      results.failed++;
    }
    
    // Wait between tests
    if (i < TESTS.length - 1) {
      logProgress('Waiting 5s before next test...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  results.avgResponseTime = totalTime / TESTS.length;

  // Final report
  logHeader('📊 FINAL REPORT');
  log('green', `✅ Passed: ${results.passed}/${TESTS.length}`);
  if (results.failed > 0) log('red', `❌ Failed: ${results.failed}/${TESTS.length}`);
  log('cyan', `⏱️  Average Response Time: ${(results.avgResponseTime / 1000).toFixed(2)}s`);
  log('cyan', `⏱️  Total Time: ${(totalTime / 1000 / 60).toFixed(2)}m`);

  saveResults(results);

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run it!
runTests().catch((err) => {
  logError(`Fatal error: ${err.message}`);
  process.exit(1);
});