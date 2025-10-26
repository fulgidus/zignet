import { describe, it, expect } from '@jest/globals';
import { Lexer } from '../src/lexer.js';
import { Parser, ParseError } from '../src/parser.js';
import type {
    Program,
    FunctionDeclaration,
    VariableDeclaration,
    ReturnStatement,
    BinaryExpression,
    Identifier,
    NumberLiteral,
} from '../src/ast.js';

function parse(source: string): Program {
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    return parser.parse();
}

describe('Parser', () => {
    describe('Function Declarations', () => {
        it('should parse simple function declaration', () => {
            const source = 'fn add(a: i32, b: i32) i32 { return a + b; }';
            const ast = parse(source);

            expect(ast.type).toBe('Program');
            expect(ast.body).toHaveLength(1);

            const fnDecl = ast.body[0] as FunctionDeclaration;
            expect(fnDecl.type).toBe('FunctionDeclaration');
            expect(fnDecl.name).toBe('add');
            expect(fnDecl.parameters).toHaveLength(2);
            expect(fnDecl.parameters[0].name).toBe('a');
            expect(fnDecl.parameters[0].typeAnnotation.type).toBe('PrimitiveType');
            expect(fnDecl.parameters[1].name).toBe('b');
            expect(fnDecl.returnType.type).toBe('PrimitiveType');
            expect(fnDecl.body.type).toBe('BlockStatement');
            expect(fnDecl.body.statements).toHaveLength(1);
        });

        it('should parse function with no parameters', () => {
            const source = 'fn hello() void { return; }';
            const ast = parse(source);

            const fnDecl = ast.body[0] as FunctionDeclaration;
            expect(fnDecl.name).toBe('hello');
            expect(fnDecl.parameters).toHaveLength(0);
        });

        it('should parse function with error union return type', () => {
            const source = 'fn doSomething() !i32 { return 42; }';
            const ast = parse(source);

            const fnDecl = ast.body[0] as FunctionDeclaration;
            expect(fnDecl.errorUnion).toBe(true);
        });

        it('should parse inline function', () => {
            const source = 'inline fn fast() void { return; }';
            const ast = parse(source);

            const fnDecl = ast.body[0] as FunctionDeclaration;
            expect(fnDecl.isInline).toBe(true);
        });

        it('should parse comptime function', () => {
            const source = 'comptime fn calculate() i32 { return 42; }';
            const ast = parse(source);

            const fnDecl = ast.body[0] as FunctionDeclaration;
            expect(fnDecl.isComptime).toBe(true);
        });
    });

    describe('Variable Declarations', () => {
        it('should parse const declaration with type and initializer', () => {
            const source = 'const x: i32 = 42;';
            const ast = parse(source);

            const varDecl = ast.body[0] as VariableDeclaration;
            expect(varDecl.type).toBe('VariableDeclaration');
            expect(varDecl.isConst).toBe(true);
            expect(varDecl.name).toBe('x');
            expect(varDecl.typeAnnotation?.type).toBe('PrimitiveType');
            expect(varDecl.initializer?.type).toBe('NumberLiteral');
        });

        it('should parse var declaration', () => {
            const source = 'var y: i32 = 10;';
            const ast = parse(source);

            const varDecl = ast.body[0] as VariableDeclaration;
            expect(varDecl.isConst).toBe(false);
            expect(varDecl.name).toBe('y');
        });

        it('should parse declaration without type annotation', () => {
            const source = 'const z = 42;';
            const ast = parse(source);

            const varDecl = ast.body[0] as VariableDeclaration;
            expect(varDecl.typeAnnotation).toBeUndefined();
            expect(varDecl.initializer).toBeDefined();
        });

        it('should parse declaration without initializer', () => {
            const source = 'var w: i32;';
            const ast = parse(source);

            const varDecl = ast.body[0] as VariableDeclaration;
            expect(varDecl.initializer).toBeUndefined();
            expect(varDecl.typeAnnotation).toBeDefined();
        });
    });

    describe('Statements', () => {
        it('should parse return statement with value', () => {
            const source = 'fn test() i32 { return 42; }';
            const ast = parse(source);

            const fnDecl = ast.body[0] as FunctionDeclaration;
            const returnStmt = fnDecl.body.statements[0] as ReturnStatement;
            expect(returnStmt.type).toBe('ReturnStatement');
            expect(returnStmt.value?.type).toBe('NumberLiteral');
        });

        it('should parse return statement without value', () => {
            const source = 'fn test() void { return; }';
            const ast = parse(source);

            const fnDecl = ast.body[0] as FunctionDeclaration;
            const returnStmt = fnDecl.body.statements[0] as ReturnStatement;
            expect(returnStmt.value).toBeUndefined();
        });

        it('should parse if statement', () => {
            const source = 'fn test() void { if (true) { return; } }';
            const ast = parse(source);

            const fnDecl = ast.body[0] as FunctionDeclaration;
            const ifStmt = fnDecl.body.statements[0];
            expect(ifStmt.type).toBe('IfStatement');
        });

        it('should parse if-else statement', () => {
            const source = 'fn test() void { if (true) { return; } else { return; } }';
            const ast = parse(source);

            const fnDecl = ast.body[0] as FunctionDeclaration;
            const ifStmt = fnDecl.body.statements[0];
            expect(ifStmt.type).toBe('IfStatement');
            expect('alternate' in ifStmt && ifStmt.alternate).toBeDefined();
        });

        it('should parse while statement', () => {
            const source = 'fn test() void { while (true) { break; } }';
            const ast = parse(source);

            const fnDecl = ast.body[0] as FunctionDeclaration;
            const whileStmt = fnDecl.body.statements[0];
            expect(whileStmt.type).toBe('WhileStatement');
        });

        it('should parse break statement', () => {
            const source = 'fn test() void { while (true) { break; } }';
            const ast = parse(source);

            const fnDecl = ast.body[0] as FunctionDeclaration;
            const whileStmt = fnDecl.body.statements[0];
            if ('body' in whileStmt && whileStmt.body.type === 'BlockStatement') {
                const breakStmt = whileStmt.body.statements[0];
                expect(breakStmt.type).toBe('BreakStatement');
            }
        });

        it('should parse continue statement', () => {
            const source = 'fn test() void { while (true) { continue; } }';
            const ast = parse(source);

            const fnDecl = ast.body[0] as FunctionDeclaration;
            const whileStmt = fnDecl.body.statements[0];
            if ('body' in whileStmt && whileStmt.body.type === 'BlockStatement') {
                const continueStmt = whileStmt.body.statements[0];
                expect(continueStmt.type).toBe('ContinueStatement');
            }
        });

        it('should parse comptime statement', () => {
            const source = 'fn test() void { comptime { const x = 42; } }';
            const ast = parse(source);

            const fnDecl = ast.body[0] as FunctionDeclaration;
            const comptimeStmt = fnDecl.body.statements[0];
            expect(comptimeStmt.type).toBe('ComptimeStatement');
        });
    });

    describe('Expressions', () => {
        it('should parse number literal', () => {
            const source = 'fn test() i32 { return 42; }';
            const ast = parse(source);

            const fnDecl = ast.body[0] as FunctionDeclaration;
            const returnStmt = fnDecl.body.statements[0] as ReturnStatement;
            const literal = returnStmt.value as NumberLiteral;
            expect(literal.type).toBe('NumberLiteral');
            expect(literal.value).toBe(42);
        });

        it('should parse string literal', () => {
            const source = 'fn test() void { const s = "hello"; }';
            const ast = parse(source);

            const fnDecl = ast.body[0] as FunctionDeclaration;
            const varDecl = fnDecl.body.statements[0] as VariableDeclaration;
            expect(varDecl.initializer?.type).toBe('StringLiteral');
        });

        it('should parse boolean literals', () => {
            const source = 'fn test() void { const t = true; const f = false; }';
            const ast = parse(source);

            const fnDecl = ast.body[0] as FunctionDeclaration;
            const trueDecl = fnDecl.body.statements[0] as VariableDeclaration;
            const falseDecl = fnDecl.body.statements[1] as VariableDeclaration;
            expect(trueDecl.initializer?.type).toBe('BooleanLiteral');
            expect(falseDecl.initializer?.type).toBe('BooleanLiteral');
        });

        it('should parse identifier', () => {
            const source = 'fn test() i32 { return x; }';
            const ast = parse(source);

            const fnDecl = ast.body[0] as FunctionDeclaration;
            const returnStmt = fnDecl.body.statements[0] as ReturnStatement;
            const ident = returnStmt.value as Identifier;
            expect(ident.type).toBe('Identifier');
            expect(ident.name).toBe('x');
        });

        it('should parse binary expression', () => {
            const source = 'fn test() i32 { return a + b; }';
            const ast = parse(source);

            const fnDecl = ast.body[0] as FunctionDeclaration;
            const returnStmt = fnDecl.body.statements[0] as ReturnStatement;
            const binExpr = returnStmt.value as BinaryExpression;
            expect(binExpr.type).toBe('BinaryExpression');
            expect(binExpr.operator).toBe('+');
            expect(binExpr.left.type).toBe('Identifier');
            expect(binExpr.right.type).toBe('Identifier');
        });

        it('should parse complex binary expression with precedence', () => {
            const source = 'fn test() i32 { return a + b * c; }';
            const ast = parse(source);

            const fnDecl = ast.body[0] as FunctionDeclaration;
            const returnStmt = fnDecl.body.statements[0] as ReturnStatement;
            const binExpr = returnStmt.value as BinaryExpression;

            // Should be: a + (b * c)
            expect(binExpr.operator).toBe('+');
            expect(binExpr.left.type).toBe('Identifier');
            expect(binExpr.right.type).toBe('BinaryExpression');

            const rightExpr = binExpr.right as BinaryExpression;
            expect(rightExpr.operator).toBe('*');
        });

        it('should parse unary expression', () => {
            const source = 'fn test() i32 { return -x; }';
            const ast = parse(source);

            const fnDecl = ast.body[0] as FunctionDeclaration;
            const returnStmt = fnDecl.body.statements[0] as ReturnStatement;
            const unaryExpr = returnStmt.value;
            expect(unaryExpr?.type).toBe('UnaryExpression');
            expect('operator' in unaryExpr! && unaryExpr.operator).toBe('-');
        });

        it('should parse function call', () => {
            const source = 'fn test() void { foo(); }';
            const ast = parse(source);

            const fnDecl = ast.body[0] as FunctionDeclaration;
            const exprStmt = fnDecl.body.statements[0];
            expect(exprStmt.type).toBe('ExpressionStatement');
            expect('expression' in exprStmt && exprStmt.expression.type).toBe('CallExpression');
        });

        it('should parse function call with arguments', () => {
            const source = 'fn test() void { add(1, 2); }';
            const ast = parse(source);

            const fnDecl = ast.body[0] as FunctionDeclaration;
            const exprStmt = fnDecl.body.statements[0];
            if ('expression' in exprStmt && exprStmt.expression.type === 'CallExpression') {
                expect(exprStmt.expression.arguments).toHaveLength(2);
            }
        });

        it('should parse member access', () => {
            const source = 'fn test() void { const y = obj.field; }';
            const ast = parse(source);

            const fnDecl = ast.body[0] as FunctionDeclaration;
            const varDecl = fnDecl.body.statements[0] as VariableDeclaration;
            expect(varDecl.initializer?.type).toBe('MemberExpression');
        });

        it('should parse index access', () => {
            const source = 'fn test() void { const y = arr[0]; }';
            const ast = parse(source);

            const fnDecl = ast.body[0] as FunctionDeclaration;
            const varDecl = fnDecl.body.statements[0] as VariableDeclaration;
            expect(varDecl.initializer?.type).toBe('IndexExpression');
        });

        it('should parse assignment', () => {
            const source = 'fn test() void { x = 42; }';
            const ast = parse(source);

            const fnDecl = ast.body[0] as FunctionDeclaration;
            const exprStmt = fnDecl.body.statements[0];
            expect('expression' in exprStmt && exprStmt.expression.type).toBe('AssignmentExpression');
        });

        it('should parse compound assignment', () => {
            const source = 'fn test() void { x += 10; }';
            const ast = parse(source);

            const fnDecl = ast.body[0] as FunctionDeclaration;
            const exprStmt = fnDecl.body.statements[0];
            if ('expression' in exprStmt && exprStmt.expression.type === 'AssignmentExpression') {
                expect(exprStmt.expression.operator).toBe('+=');
            }
        });
    });

    describe('Complex Programs', () => {
        it('should parse fibonacci function', () => {
            const source = `
        fn fibonacci(n: i32) i32 {
          if (n <= 1) {
            return n;
          }
          return fibonacci(n - 1) + fibonacci(n - 2);
        }
      `;
            const ast = parse(source);

            expect(ast.body).toHaveLength(1);
            const fnDecl = ast.body[0] as FunctionDeclaration;
            expect(fnDecl.name).toBe('fibonacci');
            expect(fnDecl.parameters).toHaveLength(1);
            expect(fnDecl.body.statements).toHaveLength(2);
        });

        it('should parse multiple declarations', () => {
            const source = `
        const PI: f32 = 3.14;
        
        fn add(a: i32, b: i32) i32 {
          return a + b;
        }
        
        fn main() void {
          const x = add(1, 2);
        }
      `;
            const ast = parse(source);

            expect(ast.body).toHaveLength(3);
            expect(ast.body[0].type).toBe('VariableDeclaration');
            expect(ast.body[1].type).toBe('FunctionDeclaration');
            expect(ast.body[2].type).toBe('FunctionDeclaration');
        });
    });

    describe('Error Handling', () => {
        it('should throw error on missing semicolon', () => {
            const source = 'const x = 42';
            expect(() => parse(source)).toThrow(ParseError);
        });

        it('should throw error on missing function body', () => {
            const source = 'fn test() void';
            expect(() => parse(source)).toThrow(ParseError);
        });

        it('should throw error on invalid expression', () => {
            const source = 'fn test() void { return +; }';
            expect(() => parse(source)).toThrow(ParseError);
        });

        it('should throw error on unclosed parenthesis', () => {
            const source = 'fn test() void { if (true { return; } }';
            expect(() => parse(source)).toThrow(ParseError);
        });

        it('should provide error context', () => {
            const source = 'fn test() void { const x }';
            try {
                parse(source);
                throw new Error('Should have thrown ParseError');
            } catch (error) {
                expect(error).toBeInstanceOf(ParseError);
                expect((error as ParseError).token).toBeDefined();
            }
        });
    });

    describe('Edge Cases', () => {
        it('should parse empty program', () => {
            const source = '';
            const ast = parse(source);
            expect(ast.body).toHaveLength(0);
        });

        it('should parse function with empty body', () => {
            const source = 'fn empty() void {}';
            const ast = parse(source);

            const fnDecl = ast.body[0] as FunctionDeclaration;
            expect(fnDecl.body.statements).toHaveLength(0);
        });

        it('should parse nested blocks', () => {
            const source = 'fn test() void { { { return; } } }';
            const ast = parse(source);

            const fnDecl = ast.body[0] as FunctionDeclaration;
            expect(fnDecl.body.statements).toHaveLength(1);
            expect(fnDecl.body.statements[0].type).toBe('BlockStatement');
        });

        it('should parse grouped expressions', () => {
            const source = 'fn test() i32 { return (a + b) * c; }';
            const ast = parse(source);

            const fnDecl = ast.body[0] as FunctionDeclaration;
            const returnStmt = fnDecl.body.statements[0] as ReturnStatement;
            const binExpr = returnStmt.value as BinaryExpression;

            // Should be: (a + b) * c
            expect(binExpr.operator).toBe('*');
            expect(binExpr.left.type).toBe('BinaryExpression');
        });
    });
});
