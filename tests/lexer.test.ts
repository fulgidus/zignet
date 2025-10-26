import { describe, it, expect } from '@jest/globals';
import { Lexer, Token, TokenType } from '../src/lexer';

describe('Lexer', () => {
  describe('Keywords', () => {
    it('should tokenize function keyword', () => {
      const lexer = new Lexer('fn');
      const tokens = lexer.tokenize();
      expect(tokens).toHaveLength(2); // fn + EOF
      expect(tokens[0].type).toBe(TokenType.FN);
      expect(tokens[0].value).toBe('fn');
    });

    it('should tokenize all keywords', () => {
      const source = 'fn const var struct union enum if else while for return break continue comptime inline';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();
      
      const expectedTypes = [
        TokenType.FN, TokenType.CONST, TokenType.VAR, TokenType.STRUCT,
        TokenType.UNION, TokenType.ENUM, TokenType.IF, TokenType.ELSE,
        TokenType.WHILE, TokenType.FOR, TokenType.RETURN, TokenType.BREAK,
        TokenType.CONTINUE, TokenType.COMPTIME, TokenType.INLINE, TokenType.EOF
      ];
      
      expect(tokens.map(t => t.type)).toEqual(expectedTypes);
    });
  });

  describe('Types', () => {
    it('should tokenize primitive types', () => {
      const source = 'i32 i64 u32 f32 f64 bool void';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();
      
      const expectedTypes = [
        TokenType.I32, TokenType.I64, TokenType.U32, TokenType.F32,
        TokenType.F64, TokenType.BOOL, TokenType.VOID, TokenType.EOF
      ];
      
      expect(tokens.map(t => t.type)).toEqual(expectedTypes);
    });
  });

  describe('Literals', () => {
    it('should tokenize integers', () => {
      const lexer = new Lexer('42 0 123456');
      const tokens = lexer.tokenize();
      
      expect(tokens[0].type).toBe(TokenType.NUMBER);
      expect(tokens[0].value).toBe('42');
      expect(tokens[1].type).toBe(TokenType.NUMBER);
      expect(tokens[1].value).toBe('0');
      expect(tokens[2].type).toBe(TokenType.NUMBER);
      expect(tokens[2].value).toBe('123456');
    });

    it('should tokenize floats', () => {
      const lexer = new Lexer('3.14 0.5 123.456');
      const tokens = lexer.tokenize();
      
      expect(tokens[0].type).toBe(TokenType.NUMBER);
      expect(tokens[0].value).toBe('3.14');
      expect(tokens[1].type).toBe(TokenType.NUMBER);
      expect(tokens[1].value).toBe('0.5');
      expect(tokens[2].type).toBe(TokenType.NUMBER);
      expect(tokens[2].value).toBe('123.456');
    });

    it('should tokenize strings with double quotes', () => {
      const lexer = new Lexer('"hello world"');
      const tokens = lexer.tokenize();
      
      expect(tokens[0].type).toBe(TokenType.STRING);
      expect(tokens[0].value).toBe('hello world');
    });

    it('should tokenize strings with single quotes', () => {
      const lexer = new Lexer("'hello world'");
      const tokens = lexer.tokenize();
      
      expect(tokens[0].type).toBe(TokenType.STRING);
      expect(tokens[0].value).toBe('hello world');
    });

    it('should handle escape sequences in strings', () => {
      const lexer = new Lexer('"hello\\nworld\\t!"');
      const tokens = lexer.tokenize();
      
      expect(tokens[0].type).toBe(TokenType.STRING);
      expect(tokens[0].value).toBe('hello\nworld\t!');
    });

    it('should detect unterminated strings', () => {
      const lexer = new Lexer('"unterminated');
      const tokens = lexer.tokenize();
      
      expect(tokens[0].type).toBe(TokenType.ERROR);
      expect(tokens[0].value).toBe('Unterminated string');
    });

    it('should tokenize booleans', () => {
      const lexer = new Lexer('true false');
      const tokens = lexer.tokenize();
      
      expect(tokens[0].type).toBe(TokenType.TRUE);
      expect(tokens[1].type).toBe(TokenType.FALSE);
    });

    it('should tokenize identifiers', () => {
      const lexer = new Lexer('foo bar_baz myVar123');
      const tokens = lexer.tokenize();
      
      expect(tokens[0].type).toBe(TokenType.IDENT);
      expect(tokens[0].value).toBe('foo');
      expect(tokens[1].type).toBe(TokenType.IDENT);
      expect(tokens[1].value).toBe('bar_baz');
      expect(tokens[2].type).toBe(TokenType.IDENT);
      expect(tokens[2].value).toBe('myVar123');
    });
  });

  describe('Operators', () => {
    it('should tokenize arithmetic operators', () => {
      const lexer = new Lexer('+ - * / %');
      const tokens = lexer.tokenize();
      
      const expectedTypes = [
        TokenType.PLUS, TokenType.MINUS, TokenType.STAR,
        TokenType.SLASH, TokenType.PERCENT, TokenType.EOF
      ];
      
      expect(tokens.map(t => t.type)).toEqual(expectedTypes);
    });

    it('should tokenize comparison operators', () => {
      const lexer = new Lexer('== != < > <= >=');
      const tokens = lexer.tokenize();
      
      const expectedTypes = [
        TokenType.EQ, TokenType.NEQ, TokenType.LT,
        TokenType.GT, TokenType.LTE, TokenType.GTE, TokenType.EOF
      ];
      
      expect(tokens.map(t => t.type)).toEqual(expectedTypes);
    });

    it('should tokenize logical operators', () => {
      const lexer = new Lexer('&& || !');
      const tokens = lexer.tokenize();
      
      expect(tokens[0].type).toBe(TokenType.AND);
      expect(tokens[1].type).toBe(TokenType.OR);
      expect(tokens[2].type).toBe(TokenType.NOT);
    });

    it('should tokenize assignment operators', () => {
      const lexer = new Lexer('= +=');
      const tokens = lexer.tokenize();
      
      expect(tokens[0].type).toBe(TokenType.ASSIGN);
      expect(tokens[1].type).toBe(TokenType.PLUS_ASSIGN);
    });

    it('should detect invalid single & operator', () => {
      const lexer = new Lexer('&');
      const tokens = lexer.tokenize();
      
      expect(tokens[0].type).toBe(TokenType.ERROR);
      expect(tokens[0].value).toContain('Unexpected char: &');
    });

    it('should detect invalid single | operator', () => {
      const lexer = new Lexer('|');
      const tokens = lexer.tokenize();
      
      expect(tokens[0].type).toBe(TokenType.ERROR);
      expect(tokens[0].value).toContain('Unexpected char: |');
    });
  });

  describe('Punctuation', () => {
    it('should tokenize parentheses and braces', () => {
      const lexer = new Lexer('( ) { } [ ]');
      const tokens = lexer.tokenize();
      
      const expectedTypes = [
        TokenType.LPAREN, TokenType.RPAREN, TokenType.LBRACE,
        TokenType.RBRACE, TokenType.LBRACKET, TokenType.RBRACKET, TokenType.EOF
      ];
      
      expect(tokens.map(t => t.type)).toEqual(expectedTypes);
    });

    it('should tokenize other punctuation', () => {
      const lexer = new Lexer(': ; , .');
      const tokens = lexer.tokenize();
      
      const expectedTypes = [
        TokenType.COLON, TokenType.SEMICOLON, TokenType.COMMA,
        TokenType.DOT, TokenType.EOF
      ];
      
      expect(tokens.map(t => t.type)).toEqual(expectedTypes);
    });

    it('should tokenize arrows', () => {
      const lexer = new Lexer('-> =>');
      const tokens = lexer.tokenize();
      
      expect(tokens[0].type).toBe(TokenType.ARROW);
      expect(tokens[1].type).toBe(TokenType.FAT_ARROW);
    });
  });

  describe('Comments', () => {
    it('should skip single-line comments', () => {
      const lexer = new Lexer('fn // this is a comment\nmain');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(3); // fn, main, EOF
      expect(tokens[0].type).toBe(TokenType.FN);
      expect(tokens[1].type).toBe(TokenType.IDENT);
      expect(tokens[1].value).toBe('main');
    });

    it('should handle multiple comments', () => {
      const lexer = new Lexer('// comment 1\nfn // comment 2\nmain // comment 3');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(3); // fn, main, EOF
      expect(tokens[0].type).toBe(TokenType.FN);
      expect(tokens[1].type).toBe(TokenType.IDENT);
    });
  });

  describe('Complex Code', () => {
    it('should tokenize a simple function', () => {
      const source = `fn add(a: i32, b: i32) i32 {
        return a + b;
      }`;
      
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();
      
      const expectedTypes = [
        TokenType.FN, TokenType.IDENT, TokenType.LPAREN,
        TokenType.IDENT, TokenType.COLON, TokenType.I32, TokenType.COMMA,
        TokenType.IDENT, TokenType.COLON, TokenType.I32, TokenType.RPAREN,
        TokenType.I32, TokenType.LBRACE,
        TokenType.RETURN, TokenType.IDENT, TokenType.PLUS, TokenType.IDENT, TokenType.SEMICOLON,
        TokenType.RBRACE, TokenType.EOF
      ];
      
      expect(tokens.map(t => t.type)).toEqual(expectedTypes);
    });

    it('should tokenize a struct declaration', () => {
      const source = 'const Point = struct { x: i32, y: i32 };';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();
      
      const expectedTypes = [
        TokenType.CONST, TokenType.IDENT, TokenType.ASSIGN, TokenType.STRUCT,
        TokenType.LBRACE, TokenType.IDENT, TokenType.COLON, TokenType.I32,
        TokenType.COMMA, TokenType.IDENT, TokenType.COLON, TokenType.I32,
        TokenType.RBRACE, TokenType.SEMICOLON, TokenType.EOF
      ];
      
      expect(tokens.map(t => t.type)).toEqual(expectedTypes);
    });

    it('should tokenize comptime code', () => {
      const source = 'comptime { const x = 42; }';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();
      
      expect(tokens[0].type).toBe(TokenType.COMPTIME);
      expect(tokens[1].type).toBe(TokenType.LBRACE);
      expect(tokens[2].type).toBe(TokenType.CONST);
    });
  });

  describe('Line and Column Tracking', () => {
    it('should track line numbers correctly', () => {
      const source = 'fn\nmain\n()';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();
      
      expect(tokens[0].line).toBe(1); // fn
      expect(tokens[1].line).toBe(2); // main
      expect(tokens[2].line).toBe(3); // (
      expect(tokens[3].line).toBe(3); // )
    });

    it('should track column numbers correctly', () => {
      const source = 'fn add()';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();
      
      expect(tokens[0].column).toBe(1); // fn
      expect(tokens[1].column).toBe(4); // add
      expect(tokens[2].column).toBe(7); // (
      expect(tokens[3].column).toBe(8); // )
    });
  });

  describe('Error Handling', () => {
    it('should report unexpected characters', () => {
      const lexer = new Lexer('@');
      const tokens = lexer.tokenize();
      
      expect(tokens[0].type).toBe(TokenType.ERROR);
      expect(tokens[0].value).toContain('Unexpected char');
    });

    it('should continue tokenizing after errors', () => {
      const lexer = new Lexer('fn @ main');
      const tokens = lexer.tokenize();
      
      expect(tokens[0].type).toBe(TokenType.FN);
      expect(tokens[1].type).toBe(TokenType.ERROR);
      expect(tokens[2].type).toBe(TokenType.IDENT);
      expect(tokens[2].value).toBe('main');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty source', () => {
      const lexer = new Lexer('');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe(TokenType.EOF);
    });

    it('should handle whitespace-only source', () => {
      const lexer = new Lexer('   \n\t  ');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe(TokenType.EOF);
    });

    it('should handle comment-only source', () => {
      const lexer = new Lexer('// just a comment');
      const tokens = lexer.tokenize();
      
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe(TokenType.EOF);
    });
  });

  describe('Token toString', () => {
    it('should format token correctly', () => {
      const token = new Token(TokenType.FN, 'fn', 1, 1);
      expect(token.toString()).toBe('Token(FN, "fn", 1:1)');
    });
  });
});
