/**
 * ZigNet Lexer
 * Tokenizes Zig source code
 */

const TokenType = {
  // Keywords
  FN: 'FN',
  CONST: 'CONST',
  VAR: 'VAR',
  STRUCT: 'STRUCT',
  UNION: 'UNION',
  ENUM: 'ENUM',
  IF: 'IF',
  ELSE: 'ELSE',
  WHILE: 'WHILE',
  FOR: 'FOR',
  RETURN: 'RETURN',
  BREAK: 'BREAK',
  CONTINUE: 'CONTINUE',
  COMPTIME: 'COMPTIME',
  INLINE: 'INLINE',
  
  // Types
  I32: 'I32',
  I64: 'I64',
  U32: 'U32',
  F32: 'F32',
  F64: 'F64',
  BOOL: 'BOOL',
  VOID: 'VOID',
  
  // Literals
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  IDENT: 'IDENT',
  TRUE: 'TRUE',
  FALSE: 'FALSE',
  
  // Operators
  PLUS: 'PLUS',
  MINUS: 'MINUS',
  STAR: 'STAR',
  SLASH: 'SLASH',
  PERCENT: 'PERCENT',
  EQ: 'EQ',
  NEQ: 'NEQ',
  LT: 'LT',
  GT: 'GT',
  LTE: 'LTE',
  GTE: 'GTE',
  ASSIGN: 'ASSIGN',
  PLUS_ASSIGN: 'PLUS_ASSIGN',
  AND: 'AND',
  OR: 'OR',
  NOT: 'NOT',
  
  // Punctuation
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  LBRACE: 'LBRACE',
  RBRACE: 'RBRACE',
  LBRACKET: 'LBRACKET',
  RBRACKET: 'RBRACKET',
  COLON: 'COLON',
  SEMICOLON: 'SEMICOLON',
  COMMA: 'COMMA',
  DOT: 'DOT',
  ARROW: 'ARROW',
  FAT_ARROW: 'FAT_ARROW',
  
  // Special
  EOF: 'EOF',
  ERROR: 'ERROR',
};

class Token {
  constructor(type, value, line, column) {
    this.type = type;
    this.value = value;
    this.line = line;
    this.column = column;
  }

  toString() {
    return `Token(${this.type}, "${this.value}", ${this.line}:${this.column})`;
  }
}

class Lexer {
  constructor(source) {
    this.source = source;
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
  }

  error(message) {
    return new Token(TokenType.ERROR, message, this.line, this.column);
  }

  peek(offset = 0) {
    const pos = this.position + offset;
    if (pos >= this.source.length) return '\0';
    return this.source[pos];
  }

  advance() {
    const char = this.source[this.position];
    this.position++;
    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return char;
  }

  skipWhitespace() {
    while (this.position < this.source.length && /\s/.test(this.peek())) {
      this.advance();
    }
  }

  skipComment() {
    if (this.peek() === '/' && this.peek(1) === '/') {
      while (this.peek() !== '\n' && this.peek() !== '\0') {
        this.advance();
      }
      return true;
    }
    return false;
  }

  readIdentifier() {
    let value = '';
    while (/[a-zA-Z0-9_]/.test(this.peek())) {
      value += this.advance();
    }
    return value;
  }

  readNumber() {
    let value = '';
    while (/[0-9]/.test(this.peek())) {
      value += this.advance();
    }
    if (this.peek() === '.' && /[0-9]/.test(this.peek(1))) {
      value += this.advance(); // '.'
      while (/[0-9]/.test(this.peek())) {
        value += this.advance();
      }
    }
    return value;
  }

  readString(quote) {
    let value = '';
    this.advance(); // opening quote
    while (this.peek() !== quote && this.peek() !== '\0') {
      if (this.peek() === '\\') {
        this.advance();
        const escaped = this.advance();
        value += this.getEscapeSequence(escaped);
      } else {
        value += this.advance();
      }
    }
    if (this.peek() === quote) {
      this.advance(); // closing quote
    } else {
      return this.error('Unterminated string');
    }
    return value;
  }

  getEscapeSequence(char) {
    const escapes = {
      'n': '\n',
      't': '\t',
      'r': '\r',
      '\\': '\\',
      '"': '"',
      "'": "'",
    };
    return escapes[char] || char;
  }

  tokenize() {
    const keywords = {
      'fn': TokenType.FN,
      'const': TokenType.CONST,
      'var': TokenType.VAR,
      'struct': TokenType.STRUCT,
      'union': TokenType.UNION,
      'enum': TokenType.ENUM,
      'if': TokenType.IF,
      'else': TokenType.ELSE,
      'while': TokenType.WHILE,
      'for': TokenType.FOR,
      'return': TokenType.RETURN,
      'break': TokenType.BREAK,
      'continue': TokenType.CONTINUE,
      'comptime': TokenType.COMPTIME,
      'inline': TokenType.INLINE,
      'i32': TokenType.I32,
      'i64': TokenType.I64,
      'u32': TokenType.U32,
      'f32': TokenType.F32,
      'f64': TokenType.F64,
      'bool': TokenType.BOOL,
      'void': TokenType.VOID,
      'true': TokenType.TRUE,
      'false': TokenType.FALSE,
    };

    while (this.position < this.source.length) {
      this.skipWhitespace();
      if (this.skipComment()) continue;

      const char = this.peek();
      const line = this.line;
      const column = this.column;

      if (char === '\0') break;

      // Numbers
      if (/[0-9]/.test(char)) {
        const value = this.readNumber();
        this.tokens.push(new Token(TokenType.NUMBER, value, line, column));
        continue;
      }

      // Strings
      if (char === '"' || char === "'") {
        const value = this.readString(char);
        if (value instanceof Token) {
          this.tokens.push(value);
        } else {
          this.tokens.push(new Token(TokenType.STRING, value, line, column));
        }
        continue;
      }

      // Identifiers and keywords
      if (/[a-zA-Z_]/.test(char)) {
        const value = this.readIdentifier();
        const type = keywords[value] || TokenType.IDENT;
        this.tokens.push(new Token(type, value, line, column));
        continue;
      }

      // Operators and punctuation
      this.advance();
      if (char === '+') {
        if (this.peek() === '=') {
          this.advance();
          this.tokens.push(new Token(TokenType.PLUS_ASSIGN, '+=', line, column));
        } else {
          this.tokens.push(new Token(TokenType.PLUS, '+', line, column));
        }
      } else if (char === '-') {
        if (this.peek() === '>') {
          this.advance();
          this.tokens.push(new Token(TokenType.ARROW, '->', line, column));
        } else {
          this.tokens.push(new Token(TokenType.MINUS, '-', line, column));
        }
      } else if (char === '*') {
        this.tokens.push(new Token(TokenType.STAR, '*', line, column));
      } else if (char === '/') {
        this.tokens.push(new Token(TokenType.SLASH, '/', line, column));
      } else if (char === '%') {
        this.tokens.push(new Token(TokenType.PERCENT, '%', line, column));
      } else if (char === '=') {
        if (this.peek() === '=') {
          this.advance();
          this.tokens.push(new Token(TokenType.EQ, '==', line, column));
        } else if (this.peek() === '>') {
          this.advance();
          this.tokens.push(new Token(TokenType.FAT_ARROW, '=>', line, column));
        } else {
          this.tokens.push(new Token(TokenType.ASSIGN, '=', line, column));
        }
      } else if (char === '!') {
        if (this.peek() === '=') {
          this.advance();
          this.tokens.push(new Token(TokenType.NEQ, '!=', line, column));
        } else {
          this.tokens.push(new Token(TokenType.NOT, '!', line, column));
        }
      } else if (char === '<') {
        if (this.peek() === '=') {
          this.advance();
          this.tokens.push(new Token(TokenType.LTE, '<=', line, column));
        } else {
          this.tokens.push(new Token(TokenType.LT, '<', line, column));
        }
      } else if (char === '>') {
        if (this.peek() === '=') {
          this.advance();
          this.tokens.push(new Token(TokenType.GTE, '>=', line, column));
        } else {
          this.tokens.push(new Token(TokenType.GT, '>', line, column));
        }
      } else if (char === '&') {
        if (this.peek() === '&') {
          this.advance();
          this.tokens.push(new Token(TokenType.AND, '&&', line, column));
        } else {
          this.tokens.push(new Token(TokenType.ERROR, `Unexpected char: &`, line, column));
        }
      } else if (char === '|') {
        if (this.peek() === '|') {
          this.advance();
          this.tokens.push(new Token(TokenType.OR, '||', line, column));
        } else {
          this.tokens.push(new Token(TokenType.ERROR, `Unexpected char: |`, line, column));
        }
      } else if (char === '(') {
        this.tokens.push(new Token(TokenType.LPAREN, '(', line, column));
      } else if (char === ')') {
        this.tokens.push(new Token(TokenType.RPAREN, ')', line, column));
      } else if (char === '{') {
        this.tokens.push(new Token(TokenType.LBRACE, '{', line, column));
      } else if (char === '}') {
        this.tokens.push(new Token(TokenType.RBRACE, '}', line, column));
      } else if (char === '[') {
        this.tokens.push(new Token(TokenType.LBRACKET, '[', line, column));
      } else if (char === ']') {
        this.tokens.push(new Token(TokenType.RBRACKET, ']', line, column));
      } else if (char === ':') {
        this.tokens.push(new Token(TokenType.COLON, ':', line, column));
      } else if (char === ';') {
        this.tokens.push(new Token(TokenType.SEMICOLON, ';', line, column));
      } else if (char === ',') {
        this.tokens.push(new Token(TokenType.COMMA, ',', line, column));
      } else if (char === '.') {
        this.tokens.push(new Token(TokenType.DOT, '.', line, column));
      } else {
        this.tokens.push(new Token(TokenType.ERROR, `Unexpected char: ${char}`, line, column));
      }
    }

    this.tokens.push(new Token(TokenType.EOF, '', this.line, this.column));
    return this.tokens;
  }
}

module.exports = { Lexer, Token, TokenType };