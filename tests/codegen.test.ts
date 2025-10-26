import { CodeGenerator } from '../src/codegen.js';
import type { Program, FunctionDeclaration, Parameter, StructField } from '../src/ast.js';

describe('CodeGenerator', () => {
    let codegen: CodeGenerator;

    beforeEach(() => {
        codegen = new CodeGenerator();
    });

    test('should generate simple function', () => {
        const params: Parameter[] = [
            {
                type: 'Parameter',
                name: 'a',
                typeAnnotation: { type: 'PrimitiveType', name: 'i32' },
            },
            {
                type: 'Parameter',
                name: 'b',
                typeAnnotation: { type: 'PrimitiveType', name: 'i32' },
            },
        ];

        const fn: FunctionDeclaration = {
            type: 'FunctionDeclaration',
            name: 'add',
            parameters: params,
            returnType: { type: 'PrimitiveType', name: 'i32' },
            body: {
                type: 'BlockStatement',
                statements: [
                    {
                        type: 'ReturnStatement',
                        value: {
                            type: 'BinaryExpression',
                            operator: '+',
                            left: { type: 'Identifier', name: 'a' },
                            right: { type: 'Identifier', name: 'b' },
                        },
                    },
                ],
            },
        };

        const program: Program = { type: 'Program', body: [fn] };
        const code = codegen.generate(program);
        expect(code).toContain('fn add(a: i32, b: i32) i32');
        expect(code).toContain('return a + b;');
    });

    test('should generate const variable', () => {
        const program: Program = {
            type: 'Program',
            body: [
                {
                    type: 'VariableDeclaration',
                    name: 'x',
                    isConst: true,
                    typeAnnotation: { type: 'PrimitiveType', name: 'i32' },
                    initializer: { type: 'NumberLiteral', value: 42 },
                },
            ],
        };

        const code = codegen.generate(program);
        expect(code).toBe('const x: i32 = 42;');
    });

    test('should generate var variable', () => {
        const program: Program = {
            type: 'Program',
            body: [
                {
                    type: 'VariableDeclaration',
                    name: 'count',
                    isConst: false,
                    typeAnnotation: { type: 'PrimitiveType', name: 'u32' },
                    initializer: { type: 'NumberLiteral', value: 0 },
                },
            ],
        };

        const code = codegen.generate(program);
        expect(code).toBe('var count: u32 = 0;');
    });

    test('should generate struct', () => {
        const fields: StructField[] = [
            {
                type: 'StructField',
                name: 'x',
                typeAnnotation: { type: 'PrimitiveType', name: 'f32' },
            },
            {
                type: 'StructField',
                name: 'y',
                typeAnnotation: { type: 'PrimitiveType', name: 'f32' },
            },
        ];

        const program: Program = {
            type: 'Program',
            body: [
                {
                    type: 'StructDeclaration',
                    name: 'Point',
                    fields: fields,
                },
            ],
        };

        const code = codegen.generate(program);
        expect(code).toContain('const Point = struct {');
        expect(code).toContain('x: f32,');
        expect(code).toContain('y: f32,');
    });

    test('should generate error union function', () => {
        const fn: FunctionDeclaration = {
            type: 'FunctionDeclaration',
            name: 'divide',
            parameters: [],
            returnType: { type: 'PrimitiveType', name: 'i32' },
            body: { type: 'BlockStatement', statements: [] },
            errorUnion: true,
        };

        const program: Program = { type: 'Program', body: [fn] };
        const code = codegen.generate(program);
        expect(code).toContain('fn divide() !i32');
    });

    test('should generate if statement', () => {
        const fn: FunctionDeclaration = {
            type: 'FunctionDeclaration',
            name: 'test',
            parameters: [],
            returnType: { type: 'PrimitiveType', name: 'void' },
            body: {
                type: 'BlockStatement',
                statements: [
                    {
                        type: 'IfStatement',
                        condition: { type: 'BooleanLiteral', value: true },
                        consequent: {
                            type: 'BlockStatement',
                            statements: [{ type: 'ReturnStatement' }],
                        },
                    },
                ],
            },
        };

        const program: Program = { type: 'Program', body: [fn] };
        const code = codegen.generate(program);
        expect(code).toContain('if (true) {');
    });

    test('should generate while loop', () => {
        const fn: FunctionDeclaration = {
            type: 'FunctionDeclaration',
            name: 'test',
            parameters: [],
            returnType: { type: 'PrimitiveType', name: 'void' },
            body: {
                type: 'BlockStatement',
                statements: [
                    {
                        type: 'WhileStatement',
                        condition: { type: 'BooleanLiteral', value: true },
                        body: {
                            type: 'BlockStatement',
                            statements: [{ type: 'BreakStatement' }],
                        },
                    },
                ],
            },
        };

        const program: Program = { type: 'Program', body: [fn] };
        const code = codegen.generate(program);
        expect(code).toContain('while (true) {');
        expect(code).toContain('break;');
    });

    test('should generate string literals with escaping', () => {
        const program: Program = {
            type: 'Program',
            body: [
                {
                    type: 'VariableDeclaration',
                    name: 'str',
                    isConst: true,
                    initializer: { type: 'StringLiteral', value: 'Hello\n"World"' },
                },
            ],
        };

        const code = codegen.generate(program);
        expect(code).toBe('const str = "Hello\\n\\"World\\"";');
    });

    test('should generate pointer type', () => {
        const program: Program = {
            type: 'Program',
            body: [
                {
                    type: 'VariableDeclaration',
                    name: 'ptr',
                    isConst: true,
                    typeAnnotation: {
                        type: 'PointerType',
                        pointeeType: { type: 'PrimitiveType', name: 'i32' },
                    },
                },
            ],
        };

        const code = codegen.generate(program);
        expect(code).toBe('const ptr: *i32;');
    });

    test('should generate array type', () => {
        const program: Program = {
            type: 'Program',
            body: [
                {
                    type: 'VariableDeclaration',
                    name: 'arr',
                    isConst: true,
                    typeAnnotation: {
                        type: 'ArrayType',
                        elementType: { type: 'PrimitiveType', name: 'i32' },
                        size: 10,
                    },
                },
            ],
        };

        const code = codegen.generate(program);
        expect(code).toBe('const arr: [10]i32;');
    });

    test('should generate optional type', () => {
        const program: Program = {
            type: 'Program',
            body: [
                {
                    type: 'VariableDeclaration',
                    name: 'opt',
                    isConst: true,
                    typeAnnotation: {
                        type: 'OptionalType',
                        valueType: { type: 'PrimitiveType', name: 'i32' },
                    },
                },
            ],
        };

        const code = codegen.generate(program);
        expect(code).toBe('const opt: ?i32;');
    });

    test('should respect indent size option', () => {
        const codegen2 = new CodeGenerator({ indentSize: 2 });
        const fn: FunctionDeclaration = {
            type: 'FunctionDeclaration',
            name: 'test',
            parameters: [],
            returnType: { type: 'PrimitiveType', name: 'void' },
            body: {
                type: 'BlockStatement',
                statements: [{ type: 'ReturnStatement' }],
            },
        };

        const program: Program = { type: 'Program', body: [fn] };
        const code = codegen2.generate(program);
        expect(code).toContain('  return;');
    });
});
