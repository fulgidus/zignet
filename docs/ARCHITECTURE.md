# ZigNet Architecture

## Phases
1. **Lexing** - Tokenize input
2. **Parsing** - Build AST
3. **Semantic Analysis** - Type checking
4. **Code Generation** - Output
5. **LLM Integration** - Error recovery

## Components
- `lexer.zig` - Tokenizer
- `parser.zig` - AST builder
- `type_checker.zig` - Validation
- `llm_integration.js` - Ollama calls
- `codegen.zig` - Output generator

## Data Structures
- Token
- AST Node
- Type Info
- Error Report