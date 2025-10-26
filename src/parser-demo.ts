/**
 * Parser Demo - Shows AST generation from Zig code
 */

import { Lexer } from './lexer.js';
import { Parser } from './parser.js';

const zigCode = `
fn fibonacci(n: i32) i32 {
    if (n <= 1) {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}

const PI: f32 = 3.14159;

fn main() void {
    const result = fibonacci(10);
    const area = PI * radius * radius;
}
`;

console.log('=== ZigNet Parser Demo ===\n');
console.log('Source code:');
console.log(zigCode);
console.log('\n' + '='.repeat(60) + '\n');

// Lexer
const lexer = new Lexer(zigCode);
const tokens = lexer.tokenize();
console.log(`✓ Lexer: Generated ${tokens.length} tokens\n`);

// Parser
const parser = new Parser(tokens);
const ast = parser.parse();
console.log(`✓ Parser: Generated AST with ${ast.body.length} top-level declarations\n`);

// Display AST
console.log('Abstract Syntax Tree (AST):');
console.log(JSON.stringify(ast, null, 2));

console.log('\n' + '='.repeat(60) + '\n');

// Analyze AST
console.log('AST Analysis:');
ast.body.forEach((decl, index) => {
    console.log(`\n${index + 1}. ${decl.type}: ${decl.name}`);

    if (decl.type === 'FunctionDeclaration') {
        console.log(`   Parameters: ${decl.parameters.length}`);
        const returnTypeName =
            decl.returnType.type === 'PrimitiveType' || decl.returnType.type === 'IdentifierType'
                ? (decl.returnType as any).name
                : 'complex';
        console.log(`   Return Type: ${decl.returnType.type} (${returnTypeName})`);
        console.log(`   Statements: ${decl.body.statements.length}`);
        if (decl.isInline) console.log('   Modifier: inline');
        if (decl.isComptime) console.log('   Modifier: comptime');
        if (decl.errorUnion) console.log('   Error Union: yes');
    } else if (decl.type === 'VariableDeclaration') {
        console.log(`   Kind: ${decl.isConst ? 'const' : 'var'}`);
        if (decl.typeAnnotation) {
            const typeName =
                decl.typeAnnotation.type === 'PrimitiveType' ||
                decl.typeAnnotation.type === 'IdentifierType'
                    ? (decl.typeAnnotation as any).name
                    : 'complex';
            console.log(`   Type: ${decl.typeAnnotation.type} (${typeName})`);
        }
        if (decl.initializer) {
            console.log(`   Initializer: ${decl.initializer.type}`);
        }
    }
});

console.log('\n' + '='.repeat(60) + '\n');
console.log('✅ Parser demo completed successfully!');
