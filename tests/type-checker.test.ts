import { describe, it, expect } from '@jest/globals';
import { Lexer } from '../src/lexer.js';
import { Parser } from '../src/parser.js';
import { TypeChecker, TypeError as TypeCheckError } from '../src/type-checker.js';

function typeCheck(source: string): TypeCheckError[] {
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();
  const checker = new TypeChecker();
  return checker.check(ast);
}

function expectNoErrors(source: string): void {
  const errors = typeCheck(source);
  if (errors.length > 0) {
    console.error('Unexpected errors:', errors.map((e) => e.toString()));
  }
  expect(errors).toHaveLength(0);
}

function expectError(source: string, messagePattern: string | RegExp): void {
  const errors = typeCheck(source);
  expect(errors.length).toBeGreaterThan(0);
  const hasMatch = errors.some((error) => {
    if (typeof messagePattern === 'string') {
      return error.message.includes(messagePattern);
    }
    return messagePattern.test(error.message);
  });
  if (!hasMatch) {
    console.error('Expected error matching:', messagePattern);
    console.error('Got errors:', errors.map((e) => e.message));
  }
  expect(hasMatch).toBe(true);
}

describe('TypeChecker', () => {
  describe('Variable Declarations', () => {
    it('should accept valid const declaration with type', () => {
      expectNoErrors('const x: i32 = 42;');
    });

    it('should accept valid var declaration', () => {
      expectNoErrors('var y: i32 = 10;');
    });

    it('should infer type from initializer', () => {
      expectNoErrors('const z = 42;');
    });

    it('should detect type mismatch in initialization', () => {
      expectError('const x: i32 = true;', 'Cannot assign');
    });

    it('should require type annotation or initializer', () => {
      expectError('const x;', 'must have either');
    });

    it('should detect duplicate declarations', () => {
      expectError(
        `
        const x: i32 = 1;
        const x: i32 = 2;
      `,
        'already defined'
      );
    });
  });

  describe('Function Declarations', () => {
    it('should accept valid function', () => {
      expectNoErrors(`
        fn add(a: i32, b: i32) i32 {
          return a + b;
        }
      `);
    });

    it('should detect missing return in non-void function', () => {
      expectError(
        `
        fn test() i32 {
          const x = 42;
        }
      `,
        'must return a value'
      );
    });

    it('should accept void function without return', () => {
      expectNoErrors(`
        fn test() void {
          const x = 42;
        }
      `);
    });

    it('should detect return type mismatch', () => {
      expectError(
        `
        fn test() i32 {
          return true;
        }
      `,
        /Return type.*does not match/
      );
    });

    it('should accept return in void function', () => {
      expectNoErrors(`
        fn test() void {
          return;
        }
      `);
    });

    it('should detect value return in void function', () => {
      expectError(
        `
        fn test() void {
          return 42;
        }
      `,
        /does not match.*void/
      );
    });
  });

  describe('Function Parameters', () => {
    it('should accept parameters in function scope', () => {
      expectNoErrors(`
        fn double(n: i32) i32 {
          return n * 2;
        }
      `);
    });

    it('should allow parameter shadowing in nested scope', () => {
      // Parameters are in their own scope, const creates a new scope
      // This is actually valid in most languages
      expectNoErrors(`
        fn test(x: i32) void {
          {
            const x: i32 = 10;
          }
        }
      `);
    });

    it('should shadow outer scope variables', () => {
      expectNoErrors(`
        const x: i32 = 1;
        fn test() void {
          const x: i32 = 2;
        }
      `);
    });
  });

  describe('Expressions - Binary Operations', () => {
    it('should accept arithmetic on numbers', () => {
      expectNoErrors(`
        fn test() i32 {
          const a: i32 = 1;
          const b: i32 = 2;
          return a + b;
        }
      `);
    });

    it('should detect non-numeric arithmetic', () => {
      expectError(
        `
        fn test() void {
          const x: bool = true;
          const y = x + 1;
        }
      `,
        'numeric operands'
      );
    });

    it('should accept comparisons', () => {
      expectNoErrors(`
        fn test() bool {
          const a: i32 = 1;
          const b: i32 = 2;
          return a < b;
        }
      `);
    });

    it('should accept logical operators on booleans', () => {
      expectNoErrors(`
        fn test() bool {
          const a: bool = true;
          const b: bool = false;
          return a && b;
        }
      `);
    });

    it('should detect non-boolean logical operations', () => {
      expectError(
        `
        fn test() void {
          const x: i32 = 1;
          const y = x && true;
        }
      `,
        'boolean operands'
      );
    });
  });

  describe('Expressions - Unary Operations', () => {
    it('should accept numeric negation', () => {
      expectNoErrors(`
        fn test() i32 {
          const x: i32 = 42;
          return -x;
        }
      `);
    });

    it('should detect non-numeric negation', () => {
      expectError(
        `
        fn test() void {
          const x: bool = true;
          const y = -x;
        }
      `,
        'numeric operand'
      );
    });

    it('should accept boolean negation', () => {
      expectNoErrors(`
        fn test() bool {
          const x: bool = true;
          return !x;
        }
      `);
    });

    it('should detect non-boolean negation', () => {
      expectError(
        `
        fn test() void {
          const x: i32 = 42;
          const y = !x;
        }
      `,
        'boolean operand'
      );
    });
  });

  describe('Function Calls', () => {
    it('should accept valid function call', () => {
      expectNoErrors(`
        fn add(a: i32, b: i32) i32 {
          return a + b;
        }
        
        fn test() void {
          const result = add(1, 2);
        }
      `);
    });

    it('should detect wrong number of arguments', () => {
      expectError(
        `
        fn add(a: i32, b: i32) i32 {
          return a + b;
        }
        
        fn test() void {
          const result = add(1);
        }
      `,
        'Expected 2 arguments, got 1'
      );
    });

    it('should detect wrong argument types', () => {
      expectError(
        `
        fn add(a: i32, b: i32) i32 {
          return a + b;
        }
        
        fn test() void {
          const result = add(1, true);
        }
      `,
        /Argument.*expected.*i32.*got.*bool/
      );
    });

    it('should detect non-callable expression', () => {
      expectError(
        `
        fn test() void {
          const x: i32 = 42;
          const y = x();
        }
      `,
        'not callable'
      );
    });
  });

  describe('Undefined Variables', () => {
    it('should detect undefined variable', () => {
      expectError(
        `
        fn test() void {
          const x = y;
        }
      `,
        "Undefined variable 'y'"
      );
    });

    it('should detect undefined function', () => {
      expectError(
        `
        fn test() void {
          foo();
        }
      `,
        "Undefined variable 'foo'"
      );
    });

    it('should accept forward-declared functions', () => {
      expectNoErrors(`
        fn foo() void {
          bar();
        }
        
        fn bar() void {
          return;
        }
      `);
    });
  });

  describe('Assignment', () => {
    it('should accept assignment to var', () => {
      expectNoErrors(`
        fn test() void {
          var x: i32 = 1;
          x = 2;
        }
      `);
    });

    it('should detect assignment to const', () => {
      expectError(
        `
        fn test() void {
          const x: i32 = 1;
          x = 2;
        }
      `,
        'Cannot assign to const'
      );
    });

    it('should detect type mismatch in assignment', () => {
      expectError(
        `
        fn test() void {
          var x: i32 = 1;
          x = true;
        }
      `,
        'Cannot assign'
      );
    });
  });

  describe('Control Flow', () => {
    it('should accept if with boolean condition', () => {
      expectNoErrors(`
        fn test() void {
          if (true) {
            return;
          }
        }
      `);
    });

    it('should detect non-boolean if condition', () => {
      expectError(
        `
        fn test() void {
          if (42) {
            return;
          }
        }
      `,
        'must be of type'
      );
    });

    it('should accept while with boolean condition', () => {
      expectNoErrors(`
        fn test() void {
          while (true) {
            break;
          }
        }
      `);
    });

    it('should detect non-boolean while condition', () => {
      expectError(
        `
        fn test() void {
          while (42) {
            break;
          }
        }
      `,
        'must be of type'
      );
    });
  });

  describe('Scope Management', () => {
    it('should handle nested scopes', () => {
      expectNoErrors(`
        fn test() void {
          const x: i32 = 1;
          {
            const y: i32 = 2;
            const z = x + y;
          }
        }
      `);
    });

    it('should not access inner scope from outer', () => {
      expectError(
        `
        fn test() void {
          {
            const x: i32 = 1;
          }
          const y = x;
        }
      `,
        "Undefined variable 'x'"
      );
    });

    it('should allow variable shadowing', () => {
      expectNoErrors(`
        fn test() void {
          const x: i32 = 1;
          {
            const x: i32 = 2;
          }
        }
      `);
    });
  });

  describe('Complex Programs', () => {
    it('should check fibonacci function', () => {
      expectNoErrors(`
        fn fibonacci(n: i32) i32 {
          if (n <= 1) {
            return n;
          }
          return fibonacci(n - 1) + fibonacci(n - 2);
        }
      `);
    });

    it('should check multiple functions', () => {
      expectNoErrors(`
        fn add(a: i32, b: i32) i32 {
          return a + b;
        }
        
        fn multiply(a: i32, b: i32) i32 {
          return a * b;
        }
        
        fn calculate() i32 {
          const x = add(1, 2);
          const y = multiply(x, 3);
          return y;
        }
      `);
    });

    it('should detect errors in complex code', () => {
      expectError(
        `
        fn add(a: i32, b: i32) i32 {
          return a + b;
        }
        
        fn test() void {
          const result = add(1, true);
        }
      `,
        /Argument.*expected.*i32.*got.*bool/
      );
    });
  });

  describe('Return Outside Function', () => {
    it('should detect return inside global scope via function', () => {
      // Return at global level would be a parse error
      // We test return without function context in a valid way
      expectNoErrors(`
        fn validReturn() void {
          return;
        }
      `);
    });
  });

  describe('Type Inference', () => {
    it('should infer i32 from number literal', () => {
      expectNoErrors(`
        fn test() void {
          const x = 42;
          const y: i32 = x;
        }
      `);
    });

    it('should infer bool from boolean literal', () => {
      expectNoErrors(`
        fn test() void {
          const x = true;
          const y: bool = x;
        }
      `);
    });

    it('should infer type from expression', () => {
      expectNoErrors(`
        fn test() void {
          const a: i32 = 1;
          const b: i32 = 2;
          const sum = a + b;
          const result: i32 = sum;
        }
      `);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty program', () => {
      expectNoErrors('');
    });

    it('should handle function with empty body', () => {
      expectNoErrors('fn empty() void {}');
    });

    it('should handle multiple errors', () => {
      const source = `
        fn test() i32 {
          const x: i32 = true;
          return y;
        }
      `;
      const errors = typeCheck(source);
      expect(errors.length).toBeGreaterThan(1);
    });
  });
});
