/**
 * Type Checker for ZigNet
 * Performs semantic analysis and type validation on the AST
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
  ExpressionStatement,
  Expression,
  BinaryExpression,
  UnaryExpression,
  CallExpression,
  MemberExpression,
  IndexExpression,
  AssignmentExpression,
  Identifier,
  TypeAnnotation,
  PrimitiveType,
  IdentifierType,
} from './ast.js';

/**
 * Type information
 */
export interface Type {
  kind: 'primitive' | 'struct' | 'function' | 'void' | 'unknown';
  name: string;
  fields?: Map<string, Type>; // For structs
  parameters?: Type[]; // For functions
  returnType?: Type; // For functions
}

/**
 * Symbol information
 */
export interface Symbol {
  name: string;
  type: Type;
  kind: 'variable' | 'function' | 'parameter' | 'struct';
  isConst: boolean;
  declared: boolean;
}

/**
 * Scope for symbol management
 */
export class Scope {
  private symbols = new Map<string, Symbol>();

  constructor(private parent?: Scope) {}

  /**
   * Define a symbol in this scope
   */
  define(name: string, symbol: Symbol): void {
    if (this.symbols.has(name)) {
      throw new TypeError(`Symbol '${name}' already defined in this scope`);
    }
    this.symbols.set(name, symbol);
  }

  /**
   * Resolve a symbol by name (checks parent scopes)
   */
  resolve(name: string): Symbol | undefined {
    const symbol = this.symbols.get(name);
    if (symbol) {
      return symbol;
    }
    if (this.parent) {
      return this.parent.resolve(name);
    }
    return undefined;
  }

  /**
   * Check if symbol exists in current scope only
   */
  has(name: string): boolean {
    return this.symbols.has(name);
  }

  /**
   * Get parent scope
   */
  getParent(): Scope | undefined {
    return this.parent;
  }
}

/**
 * Type error class
 */
export class TypeError extends Error {
  constructor(
    message: string,
    public line?: number,
    public column?: number
  ) {
    super(message);
    this.name = 'TypeError';
  }

  toString(): string {
    if (this.line && this.column) {
      return `${this.name} at ${this.line}:${this.column}: ${this.message}`;
    }
    return `${this.name}: ${this.message}`;
  }
}

/**
 * Type Checker class
 */
export class TypeChecker {
  private currentScope: Scope;
  private globalScope: Scope;
  private errors: TypeError[] = [];
  private currentFunction?: FunctionDeclaration;

  constructor() {
    this.globalScope = new Scope();
    this.currentScope = this.globalScope;
    this.initializeBuiltinTypes();
  }

  /**
   * Initialize built-in types
   */
  private initializeBuiltinTypes(): void {
    // Built-in primitive types are implicitly available
    // No need to register them in the symbol table
  }

  /**
   * Check the entire program
   */
  check(program: Program): TypeError[] {
    this.errors = [];

    try {
      // First pass: collect all declarations
      for (const declaration of program.body) {
        this.collectDeclaration(declaration);
      }

      // Second pass: type check all declarations
      for (const declaration of program.body) {
        this.checkDeclaration(declaration);
      }
    } catch (error) {
      if (error instanceof TypeError) {
        this.errors.push(error);
      } else {
        throw error;
      }
    }

    return this.errors;
  }

  /**
   * Collect declaration (first pass)
   */
  private collectDeclaration(declaration: Declaration): void {
    if (declaration.type === 'FunctionDeclaration') {
      const type = this.createFunctionType(declaration);
      this.currentScope.define(declaration.name, {
        name: declaration.name,
        type,
        kind: 'function',
        isConst: true,
        declared: true,
      });
    } else if (declaration.type === 'VariableDeclaration') {
      // Will be checked in second pass
    } else if (declaration.type === 'StructDeclaration') {
      const type = this.createStructType(declaration);
      this.currentScope.define(declaration.name, {
        name: declaration.name,
        type,
        kind: 'struct',
        isConst: true,
        declared: true,
      });
    }
  }

  /**
   * Create function type
   */
  private createFunctionType(fn: FunctionDeclaration): Type {
    const parameters = fn.parameters.map((param) =>
      this.typeAnnotationToType(param.typeAnnotation)
    );
    const returnType = this.typeAnnotationToType(fn.returnType);

    return {
      kind: 'function',
      name: fn.name,
      parameters,
      returnType,
    };
  }

  /**
   * Create struct type
   */
  private createStructType(struct: StructDeclaration): Type {
    const fields = new Map<string, Type>();
    for (const field of struct.fields) {
      fields.set(field.name, this.typeAnnotationToType(field.typeAnnotation));
    }

    return {
      kind: 'struct',
      name: struct.name,
      fields,
    };
  }

  /**
   * Convert type annotation to Type
   */
  private typeAnnotationToType(typeAnnotation: TypeAnnotation): Type {
    if (typeAnnotation.type === 'PrimitiveType') {
      return {
        kind: 'primitive',
        name: typeAnnotation.name,
      };
    } else if (typeAnnotation.type === 'IdentifierType') {
      // Look up custom type
      const symbol = this.currentScope.resolve(typeAnnotation.name);
      if (symbol && symbol.type) {
        return symbol.type;
      }
      return {
        kind: 'unknown',
        name: typeAnnotation.name,
      };
    }

    return {
      kind: 'unknown',
      name: 'unknown',
    };
  }

  /**
   * Check declaration (second pass)
   */
  private checkDeclaration(declaration: Declaration): void {
    if (declaration.type === 'FunctionDeclaration') {
      this.checkFunctionDeclaration(declaration);
    } else if (declaration.type === 'VariableDeclaration') {
      this.checkVariableDeclaration(declaration);
    }
  }

  /**
   * Check function declaration
   */
  private checkFunctionDeclaration(fn: FunctionDeclaration): void {
    this.currentFunction = fn;

    // Create new scope for function
    this.enterScope();

    // Add parameters to scope
    for (const param of fn.parameters) {
      const paramType = this.typeAnnotationToType(param.typeAnnotation);
      this.currentScope.define(param.name, {
        name: param.name,
        type: paramType,
        kind: 'parameter',
        isConst: true,
        declared: true,
      });
    }

    // Check function body
    this.checkBlockStatement(fn.body);

    // Check return type consistency
    const returnType = this.typeAnnotationToType(fn.returnType);
    if (returnType.name !== 'void') {
      // Verify all paths return a value (simplified check)
      if (!this.blockHasReturn(fn.body)) {
        this.addError(
          `Function '${fn.name}' must return a value of type '${returnType.name}'`,
          fn.line,
          fn.column
        );
      }
    }

    this.exitScope();
    this.currentFunction = undefined;
  }

  /**
   * Check if block has a return statement
   */
  private blockHasReturn(block: BlockStatement): boolean {
    for (const stmt of block.statements) {
      if (stmt.type === 'ReturnStatement') {
        return true;
      }
      if (stmt.type === 'IfStatement') {
        // Check both branches
        if ('consequent' in stmt && 'alternate' in stmt && stmt.alternate) {
          const hasReturnInConsequent = this.statementHasReturn(stmt.consequent);
          const hasReturnInAlternate = this.statementHasReturn(stmt.alternate);
          if (hasReturnInConsequent && hasReturnInAlternate) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Check if statement has a return
   */
  private statementHasReturn(stmt: Statement): boolean {
    if (stmt.type === 'ReturnStatement') {
      return true;
    }
    if (stmt.type === 'BlockStatement') {
      return this.blockHasReturn(stmt);
    }
    return false;
  }

  /**
   * Check variable declaration
   */
  private checkVariableDeclaration(varDecl: VariableDeclaration): void {
    let varType: Type;

    // Determine type
    if (varDecl.typeAnnotation) {
      varType = this.typeAnnotationToType(varDecl.typeAnnotation);
    } else if (varDecl.initializer) {
      // Infer type from initializer
      varType = this.checkExpression(varDecl.initializer);
    } else {
      this.addError(
        `Variable '${varDecl.name}' must have either a type annotation or initializer`,
        varDecl.line,
        varDecl.column
      );
      return;
    }

    // Check initializer type matches declared type
    if (varDecl.initializer && varDecl.typeAnnotation) {
      const initType = this.checkExpression(varDecl.initializer);
      if (!this.typesCompatible(varType, initType)) {
        this.addError(
          `Cannot assign value of type '${initType.name}' to variable of type '${varType.name}'`,
          varDecl.line,
          varDecl.column
        );
      }
    }

    // Add to scope
    try {
      this.currentScope.define(varDecl.name, {
        name: varDecl.name,
        type: varType,
        kind: 'variable',
        isConst: varDecl.isConst,
        declared: true,
      });
    } catch (error) {
      if (error instanceof TypeError) {
        this.addError(error.message, varDecl.line, varDecl.column);
      }
    }
  }

  /**
   * Check block statement
   */
  private checkBlockStatement(block: BlockStatement): void {
    this.enterScope();

    for (const stmt of block.statements) {
      this.checkStatement(stmt);
    }

    this.exitScope();
  }

  /**
   * Check statement
   */
  private checkStatement(stmt: Statement): void {
    switch (stmt.type) {
      case 'VariableDeclaration':
        this.checkVariableDeclaration(stmt);
        break;
      case 'ReturnStatement':
        this.checkReturnStatement(stmt);
        break;
      case 'IfStatement':
        this.checkIfStatement(stmt);
        break;
      case 'WhileStatement':
        this.checkWhileStatement(stmt);
        break;
      case 'ExpressionStatement':
        this.checkExpressionStatement(stmt);
        break;
      case 'BlockStatement':
        this.checkBlockStatement(stmt);
        break;
      case 'BreakStatement':
      case 'ContinueStatement':
        // No type checking needed
        break;
      case 'ComptimeStatement':
        this.checkBlockStatement(stmt.body);
        break;
    }
  }

  /**
   * Check return statement
   */
  private checkReturnStatement(stmt: ReturnStatement): void {
    if (!this.currentFunction) {
      this.addError('Return statement outside function', stmt.line, stmt.column);
      return;
    }

    const expectedType = this.typeAnnotationToType(this.currentFunction.returnType);

    if (stmt.value) {
      const returnType = this.checkExpression(stmt.value);
      if (!this.typesCompatible(expectedType, returnType)) {
        this.addError(
          `Return type '${returnType.name}' does not match function return type '${expectedType.name}'`,
          stmt.line,
          stmt.column
        );
      }
    } else {
      if (expectedType.name !== 'void') {
        this.addError(
          `Function must return a value of type '${expectedType.name}'`,
          stmt.line,
          stmt.column
        );
      }
    }
  }

  /**
   * Check if statement
   */
  private checkIfStatement(stmt: IfStatement): void {
    const conditionType = this.checkExpression(stmt.condition);
    if (conditionType.name !== 'bool') {
      this.addError(
        `If condition must be of type 'bool', got '${conditionType.name}'`,
        stmt.line,
        stmt.column
      );
    }

    this.checkStatement(stmt.consequent);
    if (stmt.alternate) {
      this.checkStatement(stmt.alternate);
    }
  }

  /**
   * Check while statement
   */
  private checkWhileStatement(stmt: WhileStatement): void {
    const conditionType = this.checkExpression(stmt.condition);
    if (conditionType.name !== 'bool') {
      this.addError(
        `While condition must be of type 'bool', got '${conditionType.name}'`,
        stmt.line,
        stmt.column
      );
    }

    this.checkStatement(stmt.body);
  }

  /**
   * Check expression statement
   */
  private checkExpressionStatement(stmt: ExpressionStatement): void {
    this.checkExpression(stmt.expression);
  }

  /**
   * Check expression and return its type
   */
  private checkExpression(expr: Expression): Type {
    switch (expr.type) {
      case 'NumberLiteral':
        return { kind: 'primitive', name: 'i32' }; // Default to i32
      case 'StringLiteral':
        return { kind: 'primitive', name: 'string' };
      case 'BooleanLiteral':
        return { kind: 'primitive', name: 'bool' };
      case 'Identifier':
        return this.checkIdentifier(expr);
      case 'BinaryExpression':
        return this.checkBinaryExpression(expr);
      case 'UnaryExpression':
        return this.checkUnaryExpression(expr);
      case 'CallExpression':
        return this.checkCallExpression(expr);
      case 'MemberExpression':
        return this.checkMemberExpression(expr);
      case 'IndexExpression':
        return this.checkIndexExpression(expr);
      case 'AssignmentExpression':
        return this.checkAssignmentExpression(expr);
      default:
        return { kind: 'unknown', name: 'unknown' };
    }
  }

  /**
   * Check identifier
   */
  private checkIdentifier(ident: Identifier): Type {
    const symbol = this.currentScope.resolve(ident.name);
    if (!symbol) {
      this.addError(`Undefined variable '${ident.name}'`, ident.line, ident.column);
      return { kind: 'unknown', name: 'unknown' };
    }
    return symbol.type;
  }

  /**
   * Check binary expression
   */
  private checkBinaryExpression(expr: BinaryExpression): Type {
    const leftType = this.checkExpression(expr.left);
    const rightType = this.checkExpression(expr.right);

    // Arithmetic operators
    if (['+', '-', '*', '/', '%'].includes(expr.operator)) {
      if (!this.isNumericType(leftType) || !this.isNumericType(rightType)) {
        this.addError(
          `Operator '${expr.operator}' requires numeric operands`,
          expr.line,
          expr.column
        );
      }
      return leftType; // Result has same type as operands
    }

    // Comparison operators
    if (['<', '>', '<=', '>=', '==', '!='].includes(expr.operator)) {
      if (!this.typesCompatible(leftType, rightType)) {
        this.addError(
          `Cannot compare values of type '${leftType.name}' and '${rightType.name}'`,
          expr.line,
          expr.column
        );
      }
      return { kind: 'primitive', name: 'bool' };
    }

    // Logical operators
    if (['&&', '||'].includes(expr.operator)) {
      if (leftType.name !== 'bool' || rightType.name !== 'bool') {
        this.addError(
          `Operator '${expr.operator}' requires boolean operands`,
          expr.line,
          expr.column
        );
      }
      return { kind: 'primitive', name: 'bool' };
    }

    return { kind: 'unknown', name: 'unknown' };
  }

  /**
   * Check unary expression
   */
  private checkUnaryExpression(expr: UnaryExpression): Type {
    const operandType = this.checkExpression(expr.operand);

    if (expr.operator === '-') {
      if (!this.isNumericType(operandType)) {
        this.addError(`Operator '-' requires numeric operand`, expr.line, expr.column);
      }
      return operandType;
    }

    if (expr.operator === '!') {
      if (operandType.name !== 'bool') {
        this.addError(`Operator '!' requires boolean operand`, expr.line, expr.column);
      }
      return { kind: 'primitive', name: 'bool' };
    }

    return { kind: 'unknown', name: 'unknown' };
  }

  /**
   * Check call expression
   */
  private checkCallExpression(expr: CallExpression): Type {
    const calleeType = this.checkExpression(expr.callee);

    if (calleeType.kind !== 'function') {
      this.addError('Expression is not callable', expr.line, expr.column);
      return { kind: 'unknown', name: 'unknown' };
    }

    // Check argument count
    const expectedParams = calleeType.parameters || [];
    if (expr.arguments.length !== expectedParams.length) {
      this.addError(
        `Expected ${expectedParams.length} arguments, got ${expr.arguments.length}`,
        expr.line,
        expr.column
      );
    }

    // Check argument types
    for (let i = 0; i < Math.min(expr.arguments.length, expectedParams.length); i++) {
      const argType = this.checkExpression(expr.arguments[i]);
      const paramType = expectedParams[i];
      if (!this.typesCompatible(paramType, argType)) {
        this.addError(
          `Argument ${i + 1}: expected '${paramType.name}', got '${argType.name}'`,
          expr.line,
          expr.column
        );
      }
    }

    return calleeType.returnType || { kind: 'void', name: 'void' };
  }

  /**
   * Check member expression
   */
  private checkMemberExpression(expr: MemberExpression): Type {
    const objectType = this.checkExpression(expr.object);

    if (objectType.kind !== 'struct') {
      this.addError(`Type '${objectType.name}' has no members`, expr.line, expr.column);
      return { kind: 'unknown', name: 'unknown' };
    }

    const field = objectType.fields?.get(expr.property);
    if (!field) {
      this.addError(
        `Struct '${objectType.name}' has no field '${expr.property}'`,
        expr.line,
        expr.column
      );
      return { kind: 'unknown', name: 'unknown' };
    }

    return field;
  }

  /**
   * Check index expression
   */
  private checkIndexExpression(expr: IndexExpression): Type {
    const objectType = this.checkExpression(expr.object);
    const indexType = this.checkExpression(expr.index);

    if (!this.isNumericType(indexType)) {
      this.addError('Array index must be numeric', expr.line, expr.column);
    }

    // For now, return unknown type
    return { kind: 'unknown', name: 'unknown' };
  }

  /**
   * Check assignment expression
   */
  private checkAssignmentExpression(expr: AssignmentExpression): Type {
    const leftType = this.checkExpression(expr.left);
    const rightType = this.checkExpression(expr.right);

    // Check if left side is assignable (identifier)
    if (expr.left.type === 'Identifier') {
      const symbol = this.currentScope.resolve(expr.left.name);
      if (symbol && symbol.isConst) {
        this.addError(
          `Cannot assign to const variable '${expr.left.name}'`,
          expr.line,
          expr.column
        );
      }
    }

    if (!this.typesCompatible(leftType, rightType)) {
      this.addError(
        `Cannot assign value of type '${rightType.name}' to '${leftType.name}'`,
        expr.line,
        expr.column
      );
    }

    return leftType;
  }

  /**
   * Check if types are compatible
   */
  private typesCompatible(expected: Type, actual: Type): boolean {
    if (expected.kind === 'unknown' || actual.kind === 'unknown') {
      return true; // Allow unknown types (for incomplete implementation)
    }
    return expected.name === actual.name;
  }

  /**
   * Check if type is numeric
   */
  private isNumericType(type: Type): boolean {
    return type.kind === 'primitive' && ['i32', 'i64', 'u32', 'f32', 'f64'].includes(type.name);
  }

  /**
   * Enter a new scope
   */
  private enterScope(): void {
    this.currentScope = new Scope(this.currentScope);
  }

  /**
   * Exit current scope
   */
  private exitScope(): void {
    const parent = this.currentScope.getParent();
    if (parent) {
      this.currentScope = parent;
    }
  }

  /**
   * Add an error
   */
  private addError(message: string, line?: number, column?: number): void {
    this.errors.push(new TypeError(message, line, column));
  }

  /**
   * Get all errors
   */
  getErrors(): TypeError[] {
    return this.errors;
  }
}
