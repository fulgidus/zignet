#!/usr/bin/env node

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OLLAMA_API = 'http://localhost:11434/api/generate';

// Test cases avanzati con codice Zig reale
const TEST_PROMPTS = [
  {
    id: 'allocator_deep',
    name: 'Allocator System (Deep)',
    prompt: `Explain this Zig code and what happens with memory:

\`\`\`zig
const std = @import("std");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer gpa.deinit();
    const allocator = gpa.allocator();

    var list = std.ArrayList(u32).init(allocator);
    defer list.deinit();

    try list.append(42);
    try list.append(100);
    
    for (list.items) |item| {
        std.debug.print("{d}\\n", .{item});
    }
}
\`\`\`

Why do we need \`defer\` here? What happens if we don't use it?`,
    keywords: ['allocator', 'defer', 'memory', 'leak', 'deinit', 'cleanup', 'heap', 'ArrayList'],
    category: 'advanced',
    difficulty: 'hard'
  },
  {
    id: 'comptime_generics',
    name: 'Comptime & Generics (Intermediate)',
    prompt: `What does this Zig generic function do? Explain step by step:

\`\`\`zig
fn max(comptime T: type, a: T, b: T) T {
    return if (a > b) a else b;
}

pub fn main() void {
    const int_max = max(i32, 10, 20);
    const float_max = max(f64, 3.14, 2.71);
}
\`\`\`

Why use \`comptime T: type\`? What's the difference from a regular generic?`,
    keywords: ['comptime', 'generic', 'type', 'monomorphization', 'compile-time', 'specialization', 'polymorphism'],
    category: 'advanced',
    difficulty: 'hard'
  },
  {
    id: 'error_handling_union',
    name: 'Error Handling & Tagged Unions (Intermediate)',
    prompt: `Analyze this error handling pattern:

\`\`\`zig
const FileError = error{FileNotFound, PermissionDenied, IOError};

fn readFile(path: []const u8) FileError![]u8 {
    if (path.len == 0) return error.FileNotFound;
    if (!hasPermission(path)) return error.PermissionDenied;
    // ... read file
    return buffer;
}

pub fn main() !void {
    const data = readFile("test.txt") catch |err| {
        std.debug.print("Error: {any}\\n", .{err});
        return err;
    };
}
\`\`\`

Why is this better than returning null or -1? What's the \`!\` operator doing?`,
    keywords: ['error', 'catch', 'try', 'union', 'error-set', 'try-operator', 'explicit', 'handling', 'propagate'],
    category: 'intermediate',
    difficulty: 'hard'
  },
  {
    id: 'slice_pointer_lifetime',
    name: 'Slices vs Pointers & Lifetimes (Advanced)',
    prompt: `What's wrong with this code and how to fix it?

\`\`\`zig
fn getBadSlice() []u32 {
    var array: [5]u32 = .{1, 2, 3, 4, 5};
    return array[0..5];  // ❌ Returning reference to stack memory!
}

pub fn main() void {
    const slice = getBadSlice();
    std.debug.print("{any}\\n", .{slice});  // undefined behavior
}
\`\`\`

Explain the lifetime issue. How would you fix it using an allocator?`,
    keywords: ['lifetime', 'stack', 'heap', 'dangling', 'pointer', 'slice', 'allocator', 'scope', 'return'],
    category: 'advanced',
    difficulty: 'extreme'
  },
  {
    id: 'inline_asm',
    name: 'Inline Assembly & SIMD (Expert)',
    prompt: `What does this Zig code do at a low level?

\`\`\`zig
pub fn addVectors(a: [4]i32, b: [4]i32) [4]i32 {
    var result: [4]i32 = undefined;
    
    asm volatile (
        \\\\
        : [out] "=r" (result),
        : [a_ptr] "r" (&a),
          [b_ptr] "r" (&b),
        : "memory"
    );
    
    return result;
}
\`\`\`

Explain the constraint modifiers. When would you use this vs a normal loop?`,
    keywords: ['inline', 'assembly', 'asm', 'simd', 'vectorization', 'constraint', 'cpu', 'register', 'performance'],
    category: 'expert',
    difficulty: 'extreme'
  },
  {
    id: 'build_system',
    name: 'Build System (build.zig)',
    prompt: `How would you structure a \`build.zig\` to:
1. Compile a library
2. Link against libc
3. Build an executable that uses the library
4. Add unit tests

Provide the key structure.`,
    keywords: ['build.zig', 'addLibrary', 'addExecutable', 'linkLibC', 'addTest', 'dependencies', 'artifact'],
    category: 'intermediate',
    difficulty: 'medium'
  },
  {
    id: 'undefined_behavior',
    name: 'Undefined Behavior & Safety (Intermediate)',
    prompt: `Which of these operations is safe in Zig and why?

\`\`\`zig
// 1. Integer overflow
var x: u8 = 255;
x += 1;  // Defined or undefined?

// 2. Array out of bounds
var arr: [3]i32 = .{1, 2, 3};
_ = arr[10];  // Defined or undefined?

// 3. Null pointer dereference
var ptr: *i32 = undefined;
_ = ptr.*;  // Defined or undefined?
\`\`\`

Explain what Zig does in each case and how to make it safe.`,
    keywords: ['undefined', 'safety', 'runtime-check', 'bounds', 'overflow', 'panic', 'safe', 'unsafe'],
    category: 'intermediate',
    difficulty: 'hard'
  },
  {
    id: 'struct_initialization',
    name: 'Struct Initialization & Default Values (Beginner-Intermediate)',
    prompt: `Explain what each initialization does:

\`\`\`zig
const Point = struct {
    x: i32,
    y: i32,
    label: []const u8 = "origin",
};

// 1. Default init
const p1 = Point{ .x = 10, .y = 20 };

// 2. With default
const p2: Point = .{ .x = 5, .y = 5, .label = "center" };

// 3. This one?
const p3 = Point{};  // What happens?
\`\`\`

When is each form used? What's the difference between \`.{}\` and \`{}\`?`,
    keywords: ['struct', 'initialization', 'default', 'field', 'syntax', 'shorthand', 'required'],
    category: 'beginner',
    difficulty: 'easy'
  },
  {
    id: 'sentinel_values',
    name: 'Sentinel Values & C Interop (Advanced)',
    prompt: `What are sentinel values in Zig and why are they useful?

\`\`\`zig
// C-style null-terminated string
const c_string: [*:0]const u8 = "hello";

// Sentinel slice
const numbers: [:0]const i32 = &.{1, 2, 3, 0};

pub fn main() void {
    var i: usize = 0;
    while (c_string[i] != 0) : (i += 1) {
        // Process byte
    }
}
\`\`\`

How do sentinels help with C interop? What's \`[:0]\` vs \`[*:0]\`?`,
    keywords: ['sentinel', 'null-terminated', 'c-string', 'interop', 'c-compatible', 'bounds', 'zero'],
    category: 'advanced',
    difficulty: 'hard'
  },
  {
    id: 'comptime_reflection',
    name: 'Comptime Reflection & Code Generation (Expert)',
    prompt: `What does this comptime reflection do?

\`\`\`zig
fn printFields(comptime T: type) void {
    comptime var i = 0;
    inline while (i < @typeInfo(T).Struct.fields.len) : (i += 1) {
        const field = @typeInfo(T).Struct.fields[i];
        std.debug.print("Field {}: {}\\n", .{i, field.name});
    }
}

const MyStruct = struct {
    name: []const u8,
    age: u32,
    active: bool,
};

pub fn main() void {
    printFields(MyStruct);
}
\`\`\`

Explain how \`@typeInfo\` works. What's the difference between \`comptime\` and \`inline\` loops?`,
    keywords: ['comptime', 'reflection', 'typeinfo', 'inline', 'code-generation', 'metaprogramming', 'struct-fields'],
    category: 'expert',
    difficulty: 'extreme'
  },
];

class AdvancedModelTester {
  constructor(modelName) {
    this.modelName = modelName;
    this.results = {
      model: modelName,
      timestamp: new Date().toISOString(),
      tests: {},
      summary: {}
    };
  }

  async testPrompt(testCase) {
    console.log(`  ⏳ [${testCase.difficulty.toUpperCase()}] ${testCase.name}...`);
    
    const startTime = Date.now();
    let tokenCount = 0;
    let fullResponse = '';

    try {
      const response = await axios.post(OLLAMA_API, {
        model: this.modelName,
        prompt: testCase.prompt,
        stream: false,
        temperature: 0.5, // Meno creativo per codice
      }, {
        timeout: 180000 // 3 min per risposte lunghe
      });

      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000;

      fullResponse = response.data.response || '';
      tokenCount = response.data.eval_count || Math.ceil(fullResponse.split(/\s+/).length);
      
      const tokensPerSecond = (tokenCount / totalTime).toFixed(2);
      const score = this.scoreResponse(fullResponse, testCase.keywords);
      const responseLength = fullResponse.length;
      const codeBlocksFound = (fullResponse.match(/```/g) || []).length / 2;

      this.results.tests[testCase.id] = {
        name: testCase.name,
        category: testCase.category,
        difficulty: testCase.difficulty,
        totalTime: parseFloat(totalTime.toFixed(2)),
        tokensGenerated: tokenCount,
        tokensPerSecond: parseFloat(tokensPerSecond),
        responseLength: responseLength,
        codeBlocksGenerated: Math.floor(codeBlocksFound),
        qualityScore: score,
        keywordsMatched: testCase.keywords.filter(kw => 
          fullResponse.toLowerCase().includes(kw.toLowerCase())
        ),
        keywordMatchRate: ((testCase.keywords.filter(kw => 
          fullResponse.toLowerCase().includes(kw.toLowerCase())
        ).length / testCase.keywords.length) * 100).toFixed(1),
        difficulty_factor: this.getDifficultyFactor(testCase.difficulty),
        adjusted_score: (score * this.getDifficultyFactor(testCase.difficulty)).toFixed(1)
      };

      console.log(`    ✓ ${tokensPerSecond} tokens/sec | Quality: ${score}% | Adjusted: ${this.results.tests[testCase.id].adjusted_score}%`);
      return true;

    } catch (err) {
      console.error(`    ✗ Error: ${err.message}`);
      this.results.tests[testCase.id] = {
        name: testCase.name,
        error: err.message
      };
      return false;
    }
  }

  getDifficultyFactor(difficulty) {
    const factors = {
      'easy': 1.0,
      'medium': 1.2,
      'hard': 1.5,
      'extreme': 2.0
    };
    return factors[difficulty] || 1.0;
  }

  scoreResponse(response, keywords) {
    if (!response) return 0;
    const lowerResponse = response.toLowerCase();
    const matchedKeywords = keywords.filter(kw => 
      lowerResponse.includes(kw.toLowerCase())
    ).length;
    return Math.round((matchedKeywords / keywords.length) * 100);
  }

  async runAllTests() {
    console.log(`\n🧪 ADVANCED Testing ${this.modelName}\n`);
    
    for (const testCase of TEST_PROMPTS) {
      await this.testPrompt(testCase);
    }

    this.calculateSummary();
    return this.results;
  }

  calculateSummary() {
    const tests = this.results.tests;
    const validTests = Object.values(tests).filter(t => !t.error);

    if (validTests.length === 0) {
      this.results.summary = { error: 'No valid tests' };
      return;
    }

    // Metriche globali
    const avgTokensPerSec = (
      validTests.reduce((sum, t) => sum + parseFloat(t.tokensPerSecond), 0) / validTests.length
    ).toFixed(2);

    const avgQualityScore = (
      validTests.reduce((sum, t) => sum + t.qualityScore, 0) / validTests.length
    ).toFixed(1);

    const avgAdjustedScore = (
      validTests.reduce((sum, t) => sum + parseFloat(t.adjusted_score), 0) / validTests.length
    ).toFixed(1);

    const totalTime = validTests.reduce((sum, t) => sum + t.totalTime, 0).toFixed(2);
    const avgResponseLength = Math.round(
      validTests.reduce((sum, t) => sum + t.responseLength, 0) / validTests.length
    );

    // Per difficulty
    const byDifficulty = {};
    for (const difficulty of ['easy', 'medium', 'hard', 'extreme']) {
      const diffTests = validTests.filter(t => t.difficulty === difficulty);
      if (diffTests.length > 0) {
        byDifficulty[difficulty] = {
          count: diffTests.length,
          avgScore: (diffTests.reduce((sum, t) => sum + t.qualityScore, 0) / diffTests.length).toFixed(1),
          avgTokensPerSec: (diffTests.reduce((sum, t) => sum + parseFloat(t.tokensPerSecond), 0) / diffTests.length).toFixed(2)
        };
      }
    }

    // Per categoria
    const byCategory = {};
    for (const category of ['beginner', 'intermediate', 'advanced', 'expert']) {
      const catTests = validTests.filter(t => t.category === category);
      if (catTests.length > 0) {
        byCategory[category] = {
          count: catTests.length,
          avgScore: (catTests.reduce((sum, t) => sum + t.qualityScore, 0) / catTests.length).toFixed(1),
          avgAdjustedScore: (catTests.reduce((sum, t) => sum + parseFloat(t.adjusted_score), 0) / catTests.length).toFixed(1)
        };
      }
    }

    this.results.summary = {
      totalTests: validTests.length,
      totalTimeSeconds: parseFloat(totalTime),
      averageTokensPerSecond: parseFloat(avgTokensPerSec),
      averageQualityScore: parseFloat(avgQualityScore),
      averageAdjustedScore: parseFloat(avgAdjustedScore),
      averageResponseLength: avgResponseLength,
      byDifficulty,
      byCategory,
      overallRating: this.calculateOverallRating(parseFloat(avgAdjustedScore))
    };
  }

  calculateOverallRating(score) {
    if (score >= 80) return '⭐⭐⭐⭐⭐ Excellent';
    if (score >= 70) return '⭐⭐⭐⭐ Very Good';
    if (score >= 60) return '⭐⭐⭐ Good';
    if (score >= 50) return '⭐⭐ Fair';
    return '⭐ Poor';
  }
}

async function main() {
  const modelName = process.argv[2] || 'deepseek-coder:6.7b-instruct-q4_K_M';

  console.log('═'.repeat(70));
  console.log(`🚀 Advanced Zig Model Performance Tester`);
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🖥️  Model: ${modelName}`);
  console.log(`📊 Tests: ${TEST_PROMPTS.length} (varying difficulty)`);
  console.log('═'.repeat(70));

  const tester = new AdvancedModelTester(modelName);
  const results = await tester.runAllTests();

  const outputPath = path.join(__dirname, '..', `advanced-test-${modelName.replace(/:/g, '-')}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  generateAdvancedMarkdownReport(results);

  console.log('\n' + '═'.repeat(70));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(70));
  console.log(JSON.stringify(results.summary, null, 2));
  console.log('═'.repeat(70));
  console.log(`\n✅ Results saved to:`);
  console.log(`   JSON: ${outputPath}`);
  console.log(`   Markdown: advanced-test-${modelName.replace(/:/g, '-')}.md`);
}

function generateAdvancedMarkdownReport(results) {
  const modelName = results.model;
  const summary = results.summary;
  const tests = results.tests;

  let report = `# Advanced Zig Model Performance Report\n\n`;
  report += `**Model**: ${modelName}\n`;
  report += `**Generated**: ${results.timestamp}\n`;
  report += `**Tester**: fulgidus\n\n`;

  report += `## 📊 Overall Rating\n\n`;
  report += `### ${summary.overallRating}\n`;
  report += `**Adjusted Score**: ${summary.averageAdjustedScore}%\n\n`;

  report += `## Summary Metrics\n\n`;
  report += `| Metric | Value |\n`;
  report += `|--------|-------|\n`;
  report += `| Avg Tokens/Second | ${summary.averageTokensPerSecond} |\n`;
  report += `| Avg Quality Score (Raw) | ${summary.averageQualityScore}% |\n`;
  report += `| Avg Quality Score (Difficulty-Adjusted) | ${summary.averageAdjustedScore}% |\n`;
  report += `| Avg Response Length | ${summary.averageResponseLength} chars |\n`;
  report += `| Total Time (all tests) | ${summary.totalTimeSeconds}s |\n`;
  report += `| Tests Completed | ${summary.totalTests}/${TEST_PROMPTS.length} |\n\n`;

  report += `## By Difficulty Level\n\n`;
  report += `| Level | Count | Avg Score | Avg Tokens/Sec |\n`;
  report += `|-------|-------|-----------|----------------|\n`;
  for (const [level, metrics] of Object.entries(summary.byDifficulty || {})) {
    report += `| ${level.toUpperCase()} | ${metrics.count} | ${metrics.avgScore}% | ${metrics.avgTokensPerSec} |\n`;
  }
  report += `\n`;

  report += `## By Category\n\n`;
  report += `| Category | Count | Avg Score | Adjusted Score |\n`;
  report += `|----------|-------|-----------|----------------|\n`;
  for (const [cat, metrics] of Object.entries(summary.byCategory || {})) {
    report += `| ${cat.toUpperCase()} | ${metrics.count} | ${metrics.avgScore}% | ${metrics.avgAdjustedScore}% |\n`;
  }
  report += `\n`;

  report += `## Detailed Test Results\n\n`;
  for (const [testId, testResult] of Object.entries(tests)) {
    if (testResult.error) {
      report += `### ❌ ${testResult.name}\n`;
      report += `**Error**: ${testResult.error}\n\n`;
      continue;
    }

    report += `### ✅ ${testResult.name}\n`;
    report += `**Difficulty**: ${testResult.difficulty.toUpperCase()} | **Category**: ${testResult.category}\n\n`;

    report += `| Metric | Value |\n`;
    report += `|--------|-------|\n`;
    report += `| Time | ${testResult.totalTime}s |\n`;
    report += `| Tokens Generated | ${testResult.tokensGenerated} |\n`;
    report += `| Tokens/Second | ${testResult.tokensPerSecond} |\n`;
    report += `| Quality Score | ${testResult.qualityScore}% |\n`;
    report += `| Adjusted Score (difficulty factor) | ${testResult.adjusted_score}% |\n`;
    report += `| Keyword Match Rate | ${testResult.keywordMatchRate}% |\n`;
    report += `| Code Blocks Generated | ${testResult.codeBlocksGenerated} |\n`;
    report += `| Response Length | ${testResult.responseLength} chars |\n\n`;

    report += `**Keywords Matched**: ${testResult.keywordsMatched.join(', ') || 'None'}\n\n`;
  }

  const reportPath = path.join(
    path.dirname(__dirname),
    `advanced-test-${modelName.replace(/:/g, '-')}.md`
  );
  fs.writeFileSync(reportPath, report);
}

main().catch(console.error);
