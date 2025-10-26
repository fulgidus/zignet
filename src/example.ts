/**
 * Example usage of the ZigNet Lexer
 */

import { Lexer, TokenType } from './lexer.js';

const zigCode = `
fn fibonacci(n: i32) i32 {
    if (n <= 1) {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}

const Point = struct {
    x: f32,
    y: f32,
};

fn main() void {
    const result = fibonacci(10);
    const p = Point{ .x = 3.14, .y = 2.71 };
}
`;

const lexer = new Lexer(zigCode);
const tokens = lexer.tokenize();

console.log('=== ZigNet Lexer Demo ===\n');
console.log(`Source code:\n${zigCode}\n`);
console.log(`Total tokens: ${tokens.length}\n`);

// Show first 20 tokens
console.log('First 20 tokens:');
tokens.slice(0, 20).forEach((token) => {
    console.log(`  ${token.toString()}`);
});

// Count token types
const typeCounts = new Map<TokenType, number>();
tokens.forEach((token) => {
    typeCounts.set(token.type, (typeCounts.get(token.type) || 0) + 1);
});

console.log('\nToken type distribution:');
Array.from(typeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
        console.log(`  ${type.padEnd(15)} : ${count}`);
    });
