/**
 * Abstract Syntax Tree (AST) Node Types for Zig
 */

import { Token } from './lexer.js';

/**
 * Base interface for all AST nodes
 */
export interface ASTNode {
    type: string;
    line?: number;
    column?: number;
}

/**
 * Program node - root of the AST
 */
export interface Program extends ASTNode {
    type: 'Program';
    body: Declaration[];
}

/**
 * All possible declaration types
 */
export type Declaration =
    | FunctionDeclaration
    | VariableDeclaration
    | StructDeclaration
    | UnionDeclaration
    | EnumDeclaration;

/**
 * Function declaration
 * Example: fn add(a: i32, b: i32) i32 { return a + b; }
 */
export interface FunctionDeclaration extends ASTNode {
    type: 'FunctionDeclaration';
    name: string;
    parameters: Parameter[];
    returnType: TypeAnnotation;
    body: BlockStatement;
    isInline?: boolean;
    isComptime?: boolean;
    errorUnion?: boolean; // fn foo() !ReturnType
}

/**
 * Function parameter
 */
export interface Parameter extends ASTNode {
    type: 'Parameter';
    name: string;
    typeAnnotation: TypeAnnotation;
    isComptime?: boolean;
}

/**
 * Variable declaration (const or var)
 */
export interface VariableDeclaration extends ASTNode {
    type: 'VariableDeclaration';
    isConst: boolean;
    name: string;
    typeAnnotation?: TypeAnnotation;
    initializer?: Expression;
}

/**
 * Struct declaration
 * Example: const Point = struct { x: i32, y: i32 };
 */
export interface StructDeclaration extends ASTNode {
    type: 'StructDeclaration';
    name: string;
    fields: StructField[];
}

/**
 * Struct field
 */
export interface StructField extends ASTNode {
    type: 'StructField';
    name: string;
    typeAnnotation: TypeAnnotation;
}

/**
 * Union declaration
 */
export interface UnionDeclaration extends ASTNode {
    type: 'UnionDeclaration';
    name: string;
    fields: StructField[];
}

/**
 * Enum declaration
 */
export interface EnumDeclaration extends ASTNode {
    type: 'EnumDeclaration';
    name: string;
    members: EnumMember[];
}

/**
 * Enum member
 */
export interface EnumMember extends ASTNode {
    type: 'EnumMember';
    name: string;
    value?: Expression;
}

/**
 * Type annotation
 */
export type TypeAnnotation =
    | PrimitiveType
    | IdentifierType
    | PointerType
    | ArrayType
    | ErrorUnionType
    | OptionalType;

/**
 * Primitive type (i32, f64, bool, void, etc.)
 */
export interface PrimitiveType extends ASTNode {
    type: 'PrimitiveType';
    name: string; // 'i32', 'f64', 'bool', etc.
}

/**
 * Identifier type (custom types, structs, etc.)
 */
export interface IdentifierType extends ASTNode {
    type: 'IdentifierType';
    name: string;
}

/**
 * Pointer type (*T)
 */
export interface PointerType extends ASTNode {
    type: 'PointerType';
    pointeeType: TypeAnnotation;
}

/**
 * Array type ([N]T)
 */
export interface ArrayType extends ASTNode {
    type: 'ArrayType';
    size?: number;
    elementType: TypeAnnotation;
}

/**
 * Error union type (!T)
 */
export interface ErrorUnionType extends ASTNode {
    type: 'ErrorUnionType';
    valueType: TypeAnnotation;
}

/**
 * Optional type (?T)
 */
export interface OptionalType extends ASTNode {
    type: 'OptionalType';
    valueType: TypeAnnotation;
}

/**
 * All statement types
 */
export type Statement =
    | BlockStatement
    | ReturnStatement
    | IfStatement
    | WhileStatement
    | ForStatement
    | BreakStatement
    | ContinueStatement
    | ExpressionStatement
    | VariableDeclaration
    | ComptimeStatement;

/**
 * Block statement { ... }
 */
export interface BlockStatement extends ASTNode {
    type: 'BlockStatement';
    statements: Statement[];
}

/**
 * Return statement
 */
export interface ReturnStatement extends ASTNode {
    type: 'ReturnStatement';
    value?: Expression;
}

/**
 * If statement
 */
export interface IfStatement extends ASTNode {
    type: 'IfStatement';
    condition: Expression;
    consequent: Statement;
    alternate?: Statement;
}

/**
 * While statement
 */
export interface WhileStatement extends ASTNode {
    type: 'WhileStatement';
    condition: Expression;
    body: Statement;
}

/**
 * For statement
 */
export interface ForStatement extends ASTNode {
    type: 'ForStatement';
    initializer?: Expression | VariableDeclaration;
    condition?: Expression;
    increment?: Expression;
    body: Statement;
}

/**
 * Break statement
 */
export interface BreakStatement extends ASTNode {
    type: 'BreakStatement';
}

/**
 * Continue statement
 */
export interface ContinueStatement extends ASTNode {
    type: 'ContinueStatement';
}

/**
 * Expression statement (expression followed by semicolon)
 */
export interface ExpressionStatement extends ASTNode {
    type: 'ExpressionStatement';
    expression: Expression;
}

/**
 * Comptime statement
 */
export interface ComptimeStatement extends ASTNode {
    type: 'ComptimeStatement';
    body: BlockStatement;
}

/**
 * All expression types
 */
export type Expression =
    | BinaryExpression
    | UnaryExpression
    | CallExpression
    | MemberExpression
    | IndexExpression
    | Identifier
    | NumberLiteral
    | StringLiteral
    | BooleanLiteral
    | StructLiteral
    | ArrayLiteral
    | AssignmentExpression;

/**
 * Binary expression (a + b, a * b, etc.)
 */
export interface BinaryExpression extends ASTNode {
    type: 'BinaryExpression';
    operator: string;
    left: Expression;
    right: Expression;
}

/**
 * Unary expression (-a, !a, etc.)
 */
export interface UnaryExpression extends ASTNode {
    type: 'UnaryExpression';
    operator: string;
    operand: Expression;
}

/**
 * Function call expression
 */
export interface CallExpression extends ASTNode {
    type: 'CallExpression';
    callee: Expression;
    arguments: Expression[];
}

/**
 * Member access expression (obj.field)
 */
export interface MemberExpression extends ASTNode {
    type: 'MemberExpression';
    object: Expression;
    property: string;
}

/**
 * Index expression (arr[i])
 */
export interface IndexExpression extends ASTNode {
    type: 'IndexExpression';
    object: Expression;
    index: Expression;
}

/**
 * Identifier
 */
export interface Identifier extends ASTNode {
    type: 'Identifier';
    name: string;
}

/**
 * Number literal
 */
export interface NumberLiteral extends ASTNode {
    type: 'NumberLiteral';
    value: number;
}

/**
 * String literal
 */
export interface StringLiteral extends ASTNode {
    type: 'StringLiteral';
    value: string;
}

/**
 * Boolean literal
 */
export interface BooleanLiteral extends ASTNode {
    type: 'BooleanLiteral';
    value: boolean;
}

/**
 * Struct literal
 * Example: Point{ .x = 1, .y = 2 }
 */
export interface StructLiteral extends ASTNode {
    type: 'StructLiteral';
    typeName: string;
    fields: StructLiteralField[];
}

/**
 * Struct literal field
 */
export interface StructLiteralField extends ASTNode {
    type: 'StructLiteralField';
    name: string;
    value: Expression;
}

/**
 * Array literal
 * Example: [_]i32{1, 2, 3}
 */
export interface ArrayLiteral extends ASTNode {
    type: 'ArrayLiteral';
    elements: Expression[];
}

/**
 * Assignment expression
 */
export interface AssignmentExpression extends ASTNode {
    type: 'AssignmentExpression';
    operator: string; // '=', '+=', etc.
    left: Expression;
    right: Expression;
}
