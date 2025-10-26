/**
 * Code Generator Demo
 * Demonstrates the code generation capabilities
 */

import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { CodeGenerator } from './codegen.js';

// Sample Zig code
const zigCode = `
const std = @import("std");

fn add(a: i32, b: i32) i32 {
    return a + b;
}

fn main() void {
    const x: i32 = 10;
    const y: i32 = 20;
    const result = add(x, y);
}
`;

console.log('=== ZigNet Code Generator Demo ===\n');
console.log('Original Code:');
console.log(zigCode);
console.log('\n--- Compilation Pipeline ---\n');

try {
  // Step 1: Lexing
  console.log('1. Lexing...');
  const lexer = new Lexer(zigCode);
  const tokens = lexer.tokenize();
  console.log(`   ✓ Generated ${tokens.length} tokens\n`);

  // Step 2: Parsing
  console.log('2. Parsing...');
  const parser = new Parser(tokens);
  const ast = parser.parse();
  console.log(`   ✓ Generated AST with ${ast.body.length} top-level declarations\n`);

  // Step 3: Code Generation
  console.log('3. Code Generation...');
  const codegen = new CodeGenerator({
    indentSize: 4,
    useTabs: false,
  });
  const generatedCode = codegen.generate(ast);
  console.log('   ✓ Code generated successfully\n');

  console.log('--- Generated Code ---\n');
  console.log(generatedCode);
  console.log('\n--- Statistics ---');
  console.log(`Lines: ${generatedCode.split('\n').length}`);
  console.log(`Characters: ${generatedCode.length}`);

  // Compare original vs generated
  console.log('\n--- Comparison ---');
  const originalLines = zigCode.trim().split('\n').length;
  const generatedLines = generatedCode.split('\n').length;
  console.log(`Original: ${originalLines} lines`);
  console.log(`Generated: ${generatedLines} lines`);

  // Test with different formatting options
  console.log('\n--- Alternative Formatting (2-space indent) ---\n');
  const codegen2 = new CodeGenerator({
    indentSize: 2,
    useTabs: false,
  });
  const altCode = codegen2.generate(ast);
  console.log(altCode);
} catch (error) {
  if (error instanceof Error) {
    console.error('Error:', error.message);
  }
}
