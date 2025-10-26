/**
 * Tool definitions for zignet MCP server
 * Logs only to stderr
 */

export const tools = [
  {
    name: "generate_zig_code",
    description: "Generate Zig code based on natural language description. Produces idiomatic Zig code following best practices.",
    inputSchema: {
      type: "object",
      properties: {
        description: {
          type: "string",
          description: "Natural language description of what the Zig code should do"
        },
        context: {
          type: "string",
          description: "Optional context about the existing codebase or constraints"
        }
      },
      required: ["description"]
    }
  },
  {
    name: "debug_zig_code",
    description: "Debug Zig code by analyzing errors, suggesting fixes, and explaining common pitfalls.",
    inputSchema: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "The Zig code that has issues or errors"
        },
        error_message: {
          type: "string",
          description: "Optional error message from the Zig compiler or runtime"
        },
        issue_description: {
          type: "string",
          description: "Optional description of the problem or unexpected behavior"
        }
      },
      required: ["code"]
    }
  },
  {
    name: "explain_zig_docs",
    description: "Explain Zig documentation, language features, standard library functions, or best practices.",
    inputSchema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "The Zig topic, feature, or function to explain"
        },
        detail_level: {
          type: "string",
          enum: ["beginner", "intermediate", "advanced"],
          description: "Level of detail in the explanation"
        }
      },
      required: ["topic"]
    }
  }
];
