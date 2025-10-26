/**
 * get_zig_docs tool - Query Zig documentation using LLM
 */

import { getLLM } from "../llm/session.js";

export interface GetZigDocsArgs {
    topic: string;
    detail_level?: "basic" | "intermediate" | "advanced";
}

export interface GetZigDocsResult {
    topic: string;
    documentation: string;
    examples?: string[];
}

/**
 * Get Zig documentation for a specific topic
 */
export async function getZigDocs(
    args: GetZigDocsArgs,
): Promise<GetZigDocsResult> {
    const { topic, detail_level = "intermediate" } = args;

    console.log(`📚 Getting Zig docs for: ${topic} (${detail_level})`);

    // Construct prompt based on detail level
    const detailInstructions = {
        basic: "Provide a brief, beginner-friendly explanation.",
        intermediate: "Provide a detailed explanation with practical examples.",
        advanced:
            "Provide an in-depth explanation covering edge cases, best practices, and advanced patterns.",
    };

    const prompt = `Explain the following Zig programming concept: "${topic}"

${detailInstructions[detail_level]}

Format your response as:
1. A clear definition/explanation
2. One or more code examples
3. Key points to remember

Be specific to Zig versions 0.13-0.15.`;

    try {
        const llm = await getLLM();
        const response = await llm.query(prompt);

        // Parse response to extract examples if possible
        const examples = extractCodeBlocks(response);

        return {
            topic,
            documentation: response,
            examples: examples.length > 0 ? examples : undefined,
        };
    } catch (error) {
        throw new Error(
            `Failed to get Zig docs: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

/**
 * Extract code blocks from markdown text
 */
function extractCodeBlocks(text: string): string[] {
    const codeBlockRegex = /```(?:zig)?\n([\s\S]*?)```/g;
    const blocks: string[] = [];
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
        blocks.push(match[1].trim());
    }

    return blocks;
}
