/**
 * suggest_fix tool - Suggest intelligent fixes for Zig errors
 */

import { getLLM } from '../llm/session.js';

export interface SuggestFixArgs {
    error_message: string;
    code_context?: string;
    error_type?: 'syntax' | 'type' | 'semantic' | 'runtime';
}

export interface SuggestFixResult {
    error_summary: string;
    suggested_fixes: Fix[];
    explanation: string;
}

export interface Fix {
    description: string;
    code_before?: string;
    code_after: string;
    rationale: string;
}

/**
 * Suggest fixes for Zig compilation errors
 */
export async function suggestFix(args: SuggestFixArgs): Promise<SuggestFixResult> {
    const { error_message, code_context, error_type = 'semantic' } = args;

    console.log(`💡 Suggesting fix for: ${error_message.substring(0, 50)}...`);

    // Construct prompt with error context
    const prompt = `You are analyzing a Zig compilation error. Help fix it.

Error Message:
\`\`\`
${error_message}
\`\`\`

${code_context ? `Code Context:\n\`\`\`zig\n${code_context}\n\`\`\`\n` : ''}

Error Type: ${error_type}

Provide:
1. A brief summary of what's wrong
2. 1-3 concrete fix suggestions with code examples
3. Explanation of why each fix works

Format your response clearly with code blocks for fixes.`;

    try {
        const llm = await getLLM();
        const response = await llm.query(prompt);

        // Parse the response (simplified - could be more sophisticated)
        const fixes = parseFixes(response);

        return {
            error_summary: extractErrorSummary(response),
            suggested_fixes: fixes,
            explanation: response,
        };
    } catch (error) {
        throw new Error(
            `Failed to suggest fix: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

/**
 * Extract error summary from LLM response
 */
function extractErrorSummary(response: string): string {
    // Look for first paragraph or sentence
    const lines = response.split('\n').filter((line) => line.trim());
    return lines[0] || 'Error analysis';
}

/**
 * Parse fix suggestions from LLM response
 */
function parseFixes(response: string): Fix[] {
    const fixes: Fix[] = [];

    // Extract code blocks
    const codeBlockRegex = /```(?:zig)?\n([\s\S]*?)```/g;
    const codeBlocks: string[] = [];
    let match;

    while ((match = codeBlockRegex.exec(response)) !== null) {
        codeBlocks.push(match[1].trim());
    }

    // Try to find fix descriptions
    const fixPattern = /(?:Fix|Option|Solution)\s*\d*[:.]\s*([^\n]+)/gi;
    const descriptions: string[] = [];

    while ((match = fixPattern.exec(response)) !== null) {
        descriptions.push(match[1].trim());
    }

    // Combine descriptions with code blocks
    for (let i = 0; i < Math.max(descriptions.length, codeBlocks.length); i++) {
        fixes.push({
            description: descriptions[i] || `Fix option ${i + 1}`,
            code_after: codeBlocks[i] || '// See explanation above',
            rationale: `Addresses the ${extractErrorSummary(response)}`,
        });
    }

    // If no structured fixes found, create a generic one
    if (fixes.length === 0) {
        fixes.push({
            description: 'Suggested fix',
            code_after: codeBlocks[0] || '// See detailed explanation',
            rationale: 'Based on error analysis',
        });
    }

    return fixes;
}
