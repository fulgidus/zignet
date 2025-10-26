/**
 * Recursive Descent Parser for Zig
 */

import { Token, TokenType } from './lexer.js';
import type {
    Program,
    Declaration,
    FunctionDeclaration,
    VariableDeclaration,
    StructDeclaration,
    Parameter,
    TypeAnnotation,
    PrimitiveType,
    IdentifierType,
    Statement,
    BlockStatement,
    ReturnStatement,
    IfStatement,
    WhileStatement,
    ExpressionStatement,
    ComptimeStatement,
    Expression,
    BinaryExpression,
    UnaryExpression,
    CallExpression,
    MemberExpression,
    IndexExpression,
    Identifier,
    NumberLiteral,
    StringLiteral,
    BooleanLiteral,
    AssignmentExpression,
    StructField,
} from './ast.js';

/**
 * Parser error class
 */
export class ParseError extends Error {
    constructor(
        message: string,
        public token: Token
    ) {
        super(message);
        this.name = 'ParseError';
    }

    toString(): string {
        return `${this.name} at ${this.token.line}:${this.token.column}: ${this.message}`;
    }
}

/**
 * Parser class
 */
export class Parser {
    private position = 0;

    constructor(private tokens: Token[]) {}

    /**
     * Parse the entire program
     */
    parse(): Program {
        const body: Declaration[] = [];

        while (!this.isAtEnd()) {
            body.push(this.parseDeclaration());
        }

        return {
            type: 'Program',
            body,
        };
    }

    /**
     * Parse a top-level declaration
     */
    private parseDeclaration(): Declaration {
        // Check for inline or comptime modifiers
        const isInline = this.match(TokenType.INLINE);
        const isComptime = this.match(TokenType.COMPTIME);

        if (this.check(TokenType.FN)) {
            return this.parseFunctionDeclaration(isInline, isComptime);
        }

        if (this.check(TokenType.CONST) || this.check(TokenType.VAR)) {
            const decl = this.parseVariableDeclaration();

            // Check if this is a struct/union/enum declaration
            if (
                decl.initializer &&
                decl.initializer.type === 'Identifier' &&
                (this.previous().type === TokenType.STRUCT ||
                    this.previous().type === TokenType.UNION ||
                    this.previous().type === TokenType.ENUM)
            ) {
                // This might be a struct/union/enum, but for now treat as variable
                return decl;
            }

            return decl;
        }

        throw this.error('Expected declaration');
    }

    /**
     * Parse function declaration
     */
    private parseFunctionDeclaration(isInline = false, isComptime = false): FunctionDeclaration {
        const fnToken = this.consume(TokenType.FN, "Expected 'fn'");
        const name = this.consume(TokenType.IDENT, 'Expected function name').value;

        this.consume(TokenType.LPAREN, "Expected '(' after function name");
        const parameters = this.parseParameters();
        this.consume(TokenType.RPAREN, "Expected ')' after parameters");

        // Check for error union return type (!)
        const errorUnion = this.match(TokenType.NOT);

        const returnType = this.parseTypeAnnotation();
        const body = this.parseBlockStatement();

        return {
            type: 'FunctionDeclaration',
            name,
            parameters,
            returnType,
            body,
            isInline,
            isComptime,
            errorUnion,
            line: fnToken.line,
            column: fnToken.column,
        };
    }

    /**
     * Parse function parameters
     */
    private parseParameters(): Parameter[] {
        const parameters: Parameter[] = [];

        if (!this.check(TokenType.RPAREN)) {
            do {
                const isComptime = this.match(TokenType.COMPTIME);
                const paramToken = this.consume(TokenType.IDENT, 'Expected parameter name');
                const name = paramToken.value;

                this.consume(TokenType.COLON, "Expected ':' after parameter name");
                const typeAnnotation = this.parseTypeAnnotation();

                parameters.push({
                    type: 'Parameter',
                    name,
                    typeAnnotation,
                    isComptime,
                    line: paramToken.line,
                    column: paramToken.column,
                });
            } while (this.match(TokenType.COMMA));
        }

        return parameters;
    }

    /**
     * Parse variable declaration
     */
    private parseVariableDeclaration(): VariableDeclaration {
        const isConst = this.match(TokenType.CONST);
        if (!isConst) {
            this.consume(TokenType.VAR, "Expected 'const' or 'var'");
        }

        const nameToken = this.consume(TokenType.IDENT, 'Expected variable name');
        const name = nameToken.value;

        let typeAnnotation: TypeAnnotation | undefined;
        if (this.match(TokenType.COLON)) {
            typeAnnotation = this.parseTypeAnnotation();
        }

        let initializer: Expression | undefined;
        if (this.match(TokenType.ASSIGN)) {
            initializer = this.parseExpression();
        }

        this.consume(TokenType.SEMICOLON, "Expected ';' after variable declaration");

        return {
            type: 'VariableDeclaration',
            isConst,
            name,
            typeAnnotation,
            initializer,
            line: nameToken.line,
            column: nameToken.column,
        };
    }

    /**
     * Parse type annotation
     */
    private parseTypeAnnotation(): TypeAnnotation {
        const token = this.current();

        // Primitive types
        if (
            this.check(TokenType.I32) ||
            this.check(TokenType.I64) ||
            this.check(TokenType.U32) ||
            this.check(TokenType.F32) ||
            this.check(TokenType.F64) ||
            this.check(TokenType.BOOL) ||
            this.check(TokenType.VOID)
        ) {
            this.advance();
            return {
                type: 'PrimitiveType',
                name: token.value,
                line: token.line,
                column: token.column,
            };
        }

        // Custom types (identifiers)
        if (this.check(TokenType.IDENT)) {
            const name = this.advance().value;
            return {
                type: 'IdentifierType',
                name,
                line: token.line,
                column: token.column,
            };
        }

        throw this.error('Expected type annotation');
    }

    /**
     * Parse block statement
     */
    private parseBlockStatement(): BlockStatement {
        const lbrace = this.consume(TokenType.LBRACE, "Expected '{'");
        const statements: Statement[] = [];

        while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
            statements.push(this.parseStatement());
        }

        this.consume(TokenType.RBRACE, "Expected '}'");

        return {
            type: 'BlockStatement',
            statements,
            line: lbrace.line,
            column: lbrace.column,
        };
    }

    /**
     * Parse statement
     */
    private parseStatement(): Statement {
        if (this.check(TokenType.RETURN)) {
            return this.parseReturnStatement();
        }

        if (this.check(TokenType.IF)) {
            return this.parseIfStatement();
        }

        if (this.check(TokenType.WHILE)) {
            return this.parseWhileStatement();
        }

        if (this.check(TokenType.BREAK)) {
            const token = this.advance();
            this.consume(TokenType.SEMICOLON, "Expected ';' after 'break'");
            return {
                type: 'BreakStatement',
                line: token.line,
                column: token.column,
            };
        }

        if (this.check(TokenType.CONTINUE)) {
            const token = this.advance();
            this.consume(TokenType.SEMICOLON, "Expected ';' after 'continue'");
            return {
                type: 'ContinueStatement',
                line: token.line,
                column: token.column,
            };
        }

        if (this.check(TokenType.COMPTIME)) {
            return this.parseComptimeStatement();
        }

        if (this.check(TokenType.CONST) || this.check(TokenType.VAR)) {
            return this.parseVariableDeclaration();
        }

        if (this.check(TokenType.LBRACE)) {
            return this.parseBlockStatement();
        }

        // Expression statement
        return this.parseExpressionStatement();
    }

    /**
     * Parse return statement
     */
    private parseReturnStatement(): ReturnStatement {
        const returnToken = this.consume(TokenType.RETURN, "Expected 'return'");

        let value: Expression | undefined;
        if (!this.check(TokenType.SEMICOLON)) {
            value = this.parseExpression();
        }

        this.consume(TokenType.SEMICOLON, "Expected ';' after return statement");

        return {
            type: 'ReturnStatement',
            value,
            line: returnToken.line,
            column: returnToken.column,
        };
    }

    /**
     * Parse if statement
     */
    private parseIfStatement(): IfStatement {
        const ifToken = this.consume(TokenType.IF, "Expected 'if'");

        this.consume(TokenType.LPAREN, "Expected '(' after 'if'");
        const condition = this.parseExpression();
        this.consume(TokenType.RPAREN, "Expected ')' after condition");

        const consequent = this.parseStatement();

        let alternate: Statement | undefined;
        if (this.match(TokenType.ELSE)) {
            alternate = this.parseStatement();
        }

        return {
            type: 'IfStatement',
            condition,
            consequent,
            alternate,
            line: ifToken.line,
            column: ifToken.column,
        };
    }

    /**
     * Parse while statement
     */
    private parseWhileStatement(): WhileStatement {
        const whileToken = this.consume(TokenType.WHILE, "Expected 'while'");

        this.consume(TokenType.LPAREN, "Expected '(' after 'while'");
        const condition = this.parseExpression();
        this.consume(TokenType.RPAREN, "Expected ')' after condition");

        const body = this.parseStatement();

        return {
            type: 'WhileStatement',
            condition,
            body,
            line: whileToken.line,
            column: whileToken.column,
        };
    }

    /**
     * Parse comptime statement
     */
    private parseComptimeStatement(): ComptimeStatement {
        const comptimeToken = this.consume(TokenType.COMPTIME, "Expected 'comptime'");
        const body = this.parseBlockStatement();

        return {
            type: 'ComptimeStatement',
            body,
            line: comptimeToken.line,
            column: comptimeToken.column,
        };
    }

    /**
     * Parse expression statement
     */
    private parseExpressionStatement(): ExpressionStatement {
        const expr = this.parseExpression();
        this.consume(TokenType.SEMICOLON, "Expected ';' after expression");

        return {
            type: 'ExpressionStatement',
            expression: expr,
            line: expr.line,
            column: expr.column,
        };
    }

    /**
     * Parse expression (starting point for precedence climbing)
     */
    private parseExpression(): Expression {
        return this.parseAssignment();
    }

    /**
     * Parse assignment expression
     */
    private parseAssignment(): Expression {
        const expr = this.parseLogicalOr();

        if (this.match(TokenType.ASSIGN, TokenType.PLUS_ASSIGN)) {
            const operator = this.previous().value;
            const right = this.parseAssignment();

            return {
                type: 'AssignmentExpression',
                operator,
                left: expr,
                right,
                line: expr.line,
                column: expr.column,
            };
        }

        return expr;
    }

    /**
     * Parse logical OR expression
     */
    private parseLogicalOr(): Expression {
        let left = this.parseLogicalAnd();

        while (this.match(TokenType.OR)) {
            const operator = this.previous().value;
            const right = this.parseLogicalAnd();

            left = {
                type: 'BinaryExpression',
                operator,
                left,
                right,
                line: left.line,
                column: left.column,
            };
        }

        return left;
    }

    /**
     * Parse logical AND expression
     */
    private parseLogicalAnd(): Expression {
        let left = this.parseEquality();

        while (this.match(TokenType.AND)) {
            const operator = this.previous().value;
            const right = this.parseEquality();

            left = {
                type: 'BinaryExpression',
                operator,
                left,
                right,
                line: left.line,
                column: left.column,
            };
        }

        return left;
    }

    /**
     * Parse equality expression (==, !=)
     */
    private parseEquality(): Expression {
        let left = this.parseComparison();

        while (this.match(TokenType.EQ, TokenType.NEQ)) {
            const operator = this.previous().value;
            const right = this.parseComparison();

            left = {
                type: 'BinaryExpression',
                operator,
                left,
                right,
                line: left.line,
                column: left.column,
            };
        }

        return left;
    }

    /**
     * Parse comparison expression (<, >, <=, >=)
     */
    private parseComparison(): Expression {
        let left = this.parseAddition();

        while (this.match(TokenType.LT, TokenType.GT, TokenType.LTE, TokenType.GTE)) {
            const operator = this.previous().value;
            const right = this.parseAddition();

            left = {
                type: 'BinaryExpression',
                operator,
                left,
                right,
                line: left.line,
                column: left.column,
            };
        }

        return left;
    }

    /**
     * Parse addition/subtraction expression
     */
    private parseAddition(): Expression {
        let left = this.parseMultiplication();

        while (this.match(TokenType.PLUS, TokenType.MINUS)) {
            const operator = this.previous().value;
            const right = this.parseMultiplication();

            left = {
                type: 'BinaryExpression',
                operator,
                left,
                right,
                line: left.line,
                column: left.column,
            };
        }

        return left;
    }

    /**
     * Parse multiplication/division expression
     */
    private parseMultiplication(): Expression {
        let left = this.parseUnary();

        while (this.match(TokenType.STAR, TokenType.SLASH, TokenType.PERCENT)) {
            const operator = this.previous().value;
            const right = this.parseUnary();

            left = {
                type: 'BinaryExpression',
                operator,
                left,
                right,
                line: left.line,
                column: left.column,
            };
        }

        return left;
    }

    /**
     * Parse unary expression (-, !)
     */
    private parseUnary(): Expression {
        if (this.match(TokenType.MINUS, TokenType.NOT)) {
            const operator = this.previous();

            return {
                type: 'UnaryExpression',
                operator: operator.value,
                operand: this.parseUnary(),
                line: operator.line,
                column: operator.column,
            };
        }

        return this.parsePostfix();
    }

    /**
     * Parse postfix expression (call, member access, index)
     */
    private parsePostfix(): Expression {
        let expr = this.parsePrimary();

        while (true) {
            if (this.match(TokenType.LPAREN)) {
                // Function call
                const args: Expression[] = [];

                if (!this.check(TokenType.RPAREN)) {
                    do {
                        args.push(this.parseExpression());
                    } while (this.match(TokenType.COMMA));
                }

                this.consume(TokenType.RPAREN, "Expected ')' after arguments");

                expr = {
                    type: 'CallExpression',
                    callee: expr,
                    arguments: args,
                    line: expr.line,
                    column: expr.column,
                };
            } else if (this.match(TokenType.DOT)) {
                // Member access
                const property = this.consume(TokenType.IDENT, 'Expected property name').value;

                expr = {
                    type: 'MemberExpression',
                    object: expr,
                    property,
                    line: expr.line,
                    column: expr.column,
                };
            } else if (this.match(TokenType.LBRACKET)) {
                // Index access
                const index = this.parseExpression();
                this.consume(TokenType.RBRACKET, "Expected ']' after index");

                expr = {
                    type: 'IndexExpression',
                    object: expr,
                    index,
                    line: expr.line,
                    column: expr.column,
                };
            } else {
                break;
            }
        }

        return expr;
    }

    /**
     * Parse primary expression (literals, identifiers, grouped expressions)
     */
    private parsePrimary(): Expression {
        const token = this.current();

        // Numbers
        if (this.match(TokenType.NUMBER)) {
            return {
                type: 'NumberLiteral',
                value: parseFloat(this.previous().value),
                line: token.line,
                column: token.column,
            };
        }

        // Strings
        if (this.match(TokenType.STRING)) {
            return {
                type: 'StringLiteral',
                value: this.previous().value,
                line: token.line,
                column: token.column,
            };
        }

        // Booleans
        if (this.match(TokenType.TRUE)) {
            return {
                type: 'BooleanLiteral',
                value: true,
                line: token.line,
                column: token.column,
            };
        }

        if (this.match(TokenType.FALSE)) {
            return {
                type: 'BooleanLiteral',
                value: false,
                line: token.line,
                column: token.column,
            };
        }

        // Identifiers
        if (this.match(TokenType.IDENT)) {
            return {
                type: 'Identifier',
                name: this.previous().value,
                line: token.line,
                column: token.column,
            };
        }

        // Grouped expression
        if (this.match(TokenType.LPAREN)) {
            const expr = this.parseExpression();
            this.consume(TokenType.RPAREN, "Expected ')' after expression");
            return expr;
        }

        throw this.error('Expected expression');
    }

    // ==================== Helper Methods ====================

    /**
     * Check if current token matches any of the given types
     */
    private match(...types: TokenType[]): boolean {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    /**
     * Check if current token is of given type
     */
    private check(type: TokenType): boolean {
        if (this.isAtEnd()) return false;
        return this.current().type === type;
    }

    /**
     * Consume current token if it matches expected type, otherwise throw error
     */
    private consume(type: TokenType, message: string): Token {
        if (this.check(type)) {
            return this.advance();
        }

        throw this.error(message);
    }

    /**
     * Advance to next token
     */
    private advance(): Token {
        if (!this.isAtEnd()) {
            this.position++;
        }
        return this.previous();
    }

    /**
     * Check if at end of token stream
     */
    private isAtEnd(): boolean {
        return this.current().type === TokenType.EOF;
    }

    /**
     * Get current token
     */
    private current(): Token {
        return this.tokens[this.position];
    }

    /**
     * Get previous token
     */
    private previous(): Token {
        return this.tokens[this.position - 1];
    }

    /**
     * Create a parse error
     */
    private error(message: string): ParseError {
        return new ParseError(message, this.current());
    }
}
