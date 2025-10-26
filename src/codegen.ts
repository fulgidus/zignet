/**
 * Code Generator for ZigNet
 * Generates clean, formatted Zig code from AST
 */

import type {
    Program,
    Declaration,
    FunctionDeclaration,
    VariableDeclaration,
    StructDeclaration,
    Statement,
    BlockStatement,
    ReturnStatement,
    IfStatement,
    WhileStatement,
    ForStatement,
    ExpressionStatement,
    ComptimeStatement,
    Expression,
    BinaryExpression,
    UnaryExpression,
    CallExpression,
    MemberExpression,
    IndexExpression,
    AssignmentExpression,
    Identifier,
    NumberLiteral,
    StringLiteral,
    BooleanLiteral,
    TypeAnnotation,
    Parameter,
    StructField,
} from './ast.js';

/**
 * Code generator options
 */
export interface CodeGenOptions {
    indentSize?: number;
    useTabs?: boolean;
    newlineBeforeBrace?: boolean;
    trailingComma?: boolean;
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<CodeGenOptions> = {
    indentSize: 4,
    useTabs: false,
    newlineBeforeBrace: false,
    trailingComma: false,
};

/**
 * Code Generator class
 */
export class CodeGenerator {
    private options: Required<CodeGenOptions>;
    private indentLevel = 0;
    private output: string[] = [];

    constructor(options: CodeGenOptions = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    /**
     * Generate code from AST
     */
    generate(program: Program): string {
        this.output = [];
        this.indentLevel = 0;

        for (let i = 0; i < program.body.length; i++) {
            this.generateDeclaration(program.body[i]);
            // Add blank line between top-level declarations (except last)
            if (i < program.body.length - 1) {
                this.output.push('');
            }
        }

        return this.output.join('\n');
    }

    /**
     * Generate declaration
     */
    private generateDeclaration(declaration: Declaration): void {
        switch (declaration.type) {
            case 'FunctionDeclaration':
                this.generateFunctionDeclaration(declaration);
                break;
            case 'VariableDeclaration':
                this.generateVariableDeclaration(declaration);
                break;
            case 'StructDeclaration':
                this.generateStructDeclaration(declaration);
                break;
            default:
                // Handle other declaration types
                break;
        }
    }

    /**
     * Generate function declaration
     */
    private generateFunctionDeclaration(fn: FunctionDeclaration): void {
        let line = '';

        // Modifiers
        if (fn.isInline) {
            line += 'inline ';
        }
        if (fn.isComptime) {
            line += 'comptime ';
        }

        // Function signature
        line += `fn ${fn.name}(`;

        // Parameters
        const params = fn.parameters.map((param) => this.generateParameter(param));
        line += params.join(', ');

        line += ') ';

        // Error union
        if (fn.errorUnion) {
            line += '!';
        }

        // Return type
        line += this.generateTypeAnnotation(fn.returnType);

        // Opening brace
        if (this.options.newlineBeforeBrace) {
            this.writeLine(line);
            this.writeLine('{');
        } else {
            line += ' {';
            this.writeLine(line);
        }

        // Body
        this.indent();
        this.generateBlockStatements(fn.body.statements);
        this.dedent();

        // Closing brace
        this.writeLine('}');
    }

    /**
     * Generate parameter
     */
    private generateParameter(param: Parameter): string {
        let result = '';
        if (param.isComptime) {
            result += 'comptime ';
        }
        result += param.name;
        result += ': ';
        result += this.generateTypeAnnotation(param.typeAnnotation);
        return result;
    }

    /**
     * Generate variable declaration
     */
    private generateVariableDeclaration(varDecl: VariableDeclaration): void {
        let line = varDecl.isConst ? 'const ' : 'var ';
        line += varDecl.name;

        if (varDecl.typeAnnotation) {
            line += ': ';
            line += this.generateTypeAnnotation(varDecl.typeAnnotation);
        }

        if (varDecl.initializer) {
            line += ' = ';
            line += this.generateExpression(varDecl.initializer);
        }

        line += ';';
        this.writeLine(line);
    }

    /**
     * Generate struct declaration
     */
    private generateStructDeclaration(struct: StructDeclaration): void {
        let line = `const ${struct.name} = struct {`;
        this.writeLine(line);

        this.indent();
        for (const field of struct.fields) {
            this.generateStructField(field);
        }
        this.dedent();

        this.writeLine('};');
    }

    /**
     * Generate struct field
     */
    private generateStructField(field: StructField): void {
        let line = field.name;
        line += ': ';
        line += this.generateTypeAnnotation(field.typeAnnotation);
        line += ',';
        this.writeLine(line);
    }

    /**
     * Generate type annotation
     */
    private generateTypeAnnotation(typeAnnotation: TypeAnnotation): string {
        switch (typeAnnotation.type) {
            case 'PrimitiveType':
            case 'IdentifierType':
                return typeAnnotation.name;
            case 'PointerType':
                return '*' + this.generateTypeAnnotation(typeAnnotation.pointeeType);
            case 'ArrayType':
                const size =
                    typeAnnotation.size !== undefined ? typeAnnotation.size.toString() : '';
                return `[${size}]${this.generateTypeAnnotation(typeAnnotation.elementType)}`;
            case 'ErrorUnionType':
                return '!' + this.generateTypeAnnotation(typeAnnotation.valueType);
            case 'OptionalType':
                return '?' + this.generateTypeAnnotation(typeAnnotation.valueType);
            default:
                return 'unknown';
        }
    }

    /**
     * Generate block statements
     */
    private generateBlockStatements(statements: Statement[]): void {
        for (const stmt of statements) {
            this.generateStatement(stmt);
        }
    }

    /**
     * Generate statement
     */
    private generateStatement(stmt: Statement): void {
        switch (stmt.type) {
            case 'VariableDeclaration':
                this.generateVariableDeclaration(stmt);
                break;
            case 'ReturnStatement':
                this.generateReturnStatement(stmt);
                break;
            case 'IfStatement':
                this.generateIfStatement(stmt);
                break;
            case 'WhileStatement':
                this.generateWhileStatement(stmt);
                break;
            case 'ForStatement':
                this.generateForStatement(stmt);
                break;
            case 'BreakStatement':
                this.writeLine('break;');
                break;
            case 'ContinueStatement':
                this.writeLine('continue;');
                break;
            case 'BlockStatement':
                this.generateBlockStatement(stmt);
                break;
            case 'ExpressionStatement':
                this.generateExpressionStatement(stmt);
                break;
            case 'ComptimeStatement':
                this.generateComptimeStatement(stmt);
                break;
        }
    }

    /**
     * Generate return statement
     */
    private generateReturnStatement(stmt: ReturnStatement): void {
        let line = 'return';
        if (stmt.value) {
            line += ' ';
            line += this.generateExpression(stmt.value);
        }
        line += ';';
        this.writeLine(line);
    }

    /**
     * Generate if statement
     */
    private generateIfStatement(stmt: IfStatement): void {
        let line = 'if (';
        line += this.generateExpression(stmt.condition);
        line += ') ';

        // Check if consequent is a block
        if (stmt.consequent.type === 'BlockStatement') {
            line += '{';
            this.writeLine(line);
            this.indent();
            this.generateBlockStatements(stmt.consequent.statements);
            this.dedent();
            this.write('}');
        } else {
            this.writeLine(line);
            this.indent();
            this.generateStatement(stmt.consequent);
            this.dedent();
        }

        // Else clause
        if (stmt.alternate) {
            if (stmt.consequent.type === 'BlockStatement') {
                this.output[this.output.length - 1] += ' else ';
            } else {
                this.write('else ');
            }

            if (stmt.alternate.type === 'IfStatement') {
                // else if
                this.generateIfStatement(stmt.alternate);
            } else if (stmt.alternate.type === 'BlockStatement') {
                this.output[this.output.length - 1] += '{';
                this.writeLine('');
                this.indent();
                this.generateBlockStatements(stmt.alternate.statements);
                this.dedent();
                this.writeLine('}');
            } else {
                this.writeLine('');
                this.indent();
                this.generateStatement(stmt.alternate);
                this.dedent();
            }
        } else {
            // No else, just end the line
            if (stmt.consequent.type === 'BlockStatement') {
                this.output[this.output.length - 1] += '';
                this.writeLine('');
            }
        }
    }

    /**
     * Generate while statement
     */
    private generateWhileStatement(stmt: WhileStatement): void {
        let line = 'while (';
        line += this.generateExpression(stmt.condition);
        line += ') ';

        if (stmt.body.type === 'BlockStatement') {
            line += '{';
            this.writeLine(line);
            this.indent();
            this.generateBlockStatements(stmt.body.statements);
            this.dedent();
            this.writeLine('}');
        } else {
            this.writeLine(line);
            this.indent();
            this.generateStatement(stmt.body);
            this.dedent();
        }
    }

    /**
     * Generate for statement
     */
    private generateForStatement(stmt: ForStatement): void {
        let line = 'for (';

        if (stmt.initializer) {
            if (stmt.initializer.type === 'VariableDeclaration') {
                // Special handling for var declaration in for loop
                const varDecl = stmt.initializer;
                line += varDecl.isConst ? 'const ' : 'var ';
                line += varDecl.name;
                if (varDecl.typeAnnotation) {
                    line += ': ' + this.generateTypeAnnotation(varDecl.typeAnnotation);
                }
                if (varDecl.initializer) {
                    line += ' = ' + this.generateExpression(varDecl.initializer);
                }
            } else {
                line += this.generateExpression(stmt.initializer);
            }
        }
        line += '; ';

        if (stmt.condition) {
            line += this.generateExpression(stmt.condition);
        }
        line += '; ';

        if (stmt.increment) {
            line += this.generateExpression(stmt.increment);
        }
        line += ') ';

        if (stmt.body.type === 'BlockStatement') {
            line += '{';
            this.writeLine(line);
            this.indent();
            this.generateBlockStatements(stmt.body.statements);
            this.dedent();
            this.writeLine('}');
        } else {
            this.writeLine(line);
            this.indent();
            this.generateStatement(stmt.body);
            this.dedent();
        }
    }

    /**
     * Generate block statement
     */
    private generateBlockStatement(stmt: BlockStatement): void {
        this.writeLine('{');
        this.indent();
        this.generateBlockStatements(stmt.statements);
        this.dedent();
        this.writeLine('}');
    }

    /**
     * Generate expression statement
     */
    private generateExpressionStatement(stmt: ExpressionStatement): void {
        const line = this.generateExpression(stmt.expression) + ';';
        this.writeLine(line);
    }

    /**
     * Generate comptime statement
     */
    private generateComptimeStatement(stmt: ComptimeStatement): void {
        this.writeLine('comptime {');
        this.indent();
        this.generateBlockStatements(stmt.body.statements);
        this.dedent();
        this.writeLine('}');
    }

    /**
     * Generate expression
     */
    private generateExpression(expr: Expression): string {
        switch (expr.type) {
            case 'NumberLiteral':
                return this.generateNumberLiteral(expr);
            case 'StringLiteral':
                return this.generateStringLiteral(expr);
            case 'BooleanLiteral':
                return this.generateBooleanLiteral(expr);
            case 'Identifier':
                return this.generateIdentifier(expr);
            case 'BinaryExpression':
                return this.generateBinaryExpression(expr);
            case 'UnaryExpression':
                return this.generateUnaryExpression(expr);
            case 'CallExpression':
                return this.generateCallExpression(expr);
            case 'MemberExpression':
                return this.generateMemberExpression(expr);
            case 'IndexExpression':
                return this.generateIndexExpression(expr);
            case 'AssignmentExpression':
                return this.generateAssignmentExpression(expr);
            case 'StructLiteral':
                return this.generateStructLiteral(expr);
            case 'ArrayLiteral':
                return this.generateArrayLiteral(expr);
            default:
                return 'unknown';
        }
    }

    /**
     * Generate number literal
     */
    private generateNumberLiteral(expr: NumberLiteral): string {
        return expr.value.toString();
    }

    /**
     * Generate string literal
     */
    private generateStringLiteral(expr: StringLiteral): string {
        // Escape special characters
        const escaped = expr.value
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
        return `"${escaped}"`;
    }

    /**
     * Generate boolean literal
     */
    private generateBooleanLiteral(expr: BooleanLiteral): string {
        return expr.value ? 'true' : 'false';
    }

    /**
     * Generate identifier
     */
    private generateIdentifier(expr: Identifier): string {
        return expr.name;
    }

    /**
     * Generate binary expression
     */
    private generateBinaryExpression(expr: BinaryExpression): string {
        const left = this.generateExpression(expr.left);
        const right = this.generateExpression(expr.right);
        return `${left} ${expr.operator} ${right}`;
    }

    /**
     * Generate unary expression
     */
    private generateUnaryExpression(expr: UnaryExpression): string {
        const operand = this.generateExpression(expr.operand);
        return `${expr.operator}${operand}`;
    }

    /**
     * Generate call expression
     */
    private generateCallExpression(expr: CallExpression): string {
        const callee = this.generateExpression(expr.callee);
        const args = expr.arguments.map((arg) => this.generateExpression(arg));
        return `${callee}(${args.join(', ')})`;
    }

    /**
     * Generate member expression
     */
    private generateMemberExpression(expr: MemberExpression): string {
        const object = this.generateExpression(expr.object);
        return `${object}.${expr.property}`;
    }

    /**
     * Generate index expression
     */
    private generateIndexExpression(expr: IndexExpression): string {
        const object = this.generateExpression(expr.object);
        const index = this.generateExpression(expr.index);
        return `${object}[${index}]`;
    }

    /**
     * Generate assignment expression
     */
    private generateAssignmentExpression(expr: AssignmentExpression): string {
        const left = this.generateExpression(expr.left);
        const right = this.generateExpression(expr.right);
        return `${left} ${expr.operator} ${right}`;
    }

    /**
     * Generate struct literal
     */
    private generateStructLiteral(expr: any): string {
        let result = expr.typeName + '{ ';
        const fields = expr.fields.map((field: any) => {
            return `.${field.name} = ${this.generateExpression(field.value)}`;
        });
        result += fields.join(', ');
        result += ' }';
        return result;
    }

    /**
     * Generate array literal
     */
    private generateArrayLiteral(expr: any): string {
        const elements = expr.elements.map((elem: any) => this.generateExpression(elem));
        return `[_]{ ${elements.join(', ')} }`;
    }

    /**
     * Write a line with proper indentation
     */
    private writeLine(text: string): void {
        if (text === '') {
            this.output.push('');
        } else {
            this.output.push(this.getIndent() + text);
        }
    }

    /**
     * Write without newline
     */
    private write(text: string): void {
        if (this.output.length === 0) {
            this.output.push(this.getIndent() + text);
        } else {
            this.output[this.output.length - 1] += text;
        }
    }

    /**
     * Get current indentation string
     */
    private getIndent(): string {
        if (this.options.useTabs) {
            return '\t'.repeat(this.indentLevel);
        }
        return ' '.repeat(this.indentLevel * this.options.indentSize);
    }

    /**
     * Increase indentation level
     */
    private indent(): void {
        this.indentLevel++;
    }

    /**
     * Decrease indentation level
     */
    private dedent(): void {
        if (this.indentLevel > 0) {
            this.indentLevel--;
        }
    }
}
