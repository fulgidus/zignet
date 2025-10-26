const vscode = require('vscode');
const { spawn } = require('child_process');
const path = require('path');

let mcpServerProcess = null;
let outputChannel = null;

/**
 * Activate the extension
 */
function activate(context) {
    console.log('ZigNet extension is now active');

    // Create output channel for logs
    outputChannel = vscode.window.createOutputChannel('ZigNet');
    context.subscriptions.push(outputChannel);

    // Start MCP server if enabled
    const config = vscode.workspace.getConfiguration('zignet');
    if (config.get('enable')) {
        startMCPServer();
    }

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('zignet.analyzeCurrentFile', analyzeCurrentFile),
        vscode.commands.registerCommand('zignet.formatCurrentFile', formatCurrentFile),
        vscode.commands.registerCommand('zignet.getDocs', getDocs),
        vscode.commands.registerCommand('zignet.restart', restartServer)
    );

    // Watch for configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('zignet.enable')) {
                const enabled = vscode.workspace.getConfiguration('zignet').get('enable');
                if (enabled) {
                    startMCPServer();
                } else {
                    stopMCPServer();
                }
            }
        })
    );

    // Stop server on deactivation
    context.subscriptions.push({
        dispose: stopMCPServer
    });
}

/**
 * Start the MCP server process
 */
function startMCPServer() {
    if (mcpServerProcess) {
        outputChannel.appendLine('⚠️  MCP server already running');
        return;
    }

    outputChannel.appendLine('🚀 Starting ZigNet MCP server...');

    try {
        // Start the zignet CLI (which runs the MCP server)
        mcpServerProcess = spawn('npx', ['-y', 'zignet'], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env }
        });

        mcpServerProcess.stdout.on('data', (data) => {
            const output = data.toString();
            // Parse JSON-RPC messages (optional, for debugging)
            outputChannel.appendLine(`[STDOUT] ${output}`);
        });

        mcpServerProcess.stderr.on('data', (data) => {
            const output = data.toString();
            outputChannel.appendLine(`[INFO] ${output}`);
        });

        mcpServerProcess.on('error', (error) => {
            outputChannel.appendLine(`❌ Error: ${error.message}`);
            vscode.window.showErrorMessage(`ZigNet server error: ${error.message}`);
        });

        mcpServerProcess.on('close', (code) => {
            outputChannel.appendLine(`Server exited with code ${code}`);
            mcpServerProcess = null;
            if (code !== 0 && code !== null) {
                vscode.window.showWarningMessage(`ZigNet server stopped unexpectedly (code ${code})`);
            }
        });

        outputChannel.appendLine('✅ ZigNet MCP server started');
        vscode.window.showInformationMessage('ZigNet MCP server started');
    } catch (error) {
        outputChannel.appendLine(`❌ Failed to start server: ${error.message}`);
        vscode.window.showErrorMessage(`Failed to start ZigNet: ${error.message}`);
    }
}

/**
 * Stop the MCP server process
 */
function stopMCPServer() {
    if (mcpServerProcess) {
        outputChannel.appendLine('🛑 Stopping ZigNet MCP server...');
        mcpServerProcess.kill();
        mcpServerProcess = null;
        outputChannel.appendLine('✅ Server stopped');
    }
}

/**
 * Restart the MCP server
 */
function restartServer() {
    stopMCPServer();
    setTimeout(() => startMCPServer(), 1000);
}

/**
 * Analyze the current Zig file
 */
async function analyzeCurrentFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'zig') {
        vscode.window.showWarningMessage('Please open a Zig file first');
        return;
    }

    const code = editor.document.getText();
    // TODO: Send MCP request to analyze_zig tool
    vscode.window.showInformationMessage('Analysis feature coming soon - use MCP client integration');
}

/**
 * Format the current Zig file
 */
async function formatCurrentFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'zig') {
        vscode.window.showWarningMessage('Please open a Zig file first');
        return;
    }

    const code = editor.document.getText();
    // TODO: Send MCP request to compile_zig tool
    vscode.window.showInformationMessage('Format feature coming soon - use MCP client integration');
}

/**
 * Get documentation for selected topic
 */
async function getDocs() {
    const topic = await vscode.window.showInputBox({
        prompt: 'Enter Zig topic (e.g., comptime, generics)',
        placeHolder: 'comptime'
    });

    if (topic) {
        // TODO: Send MCP request to get_zig_docs tool
        vscode.window.showInformationMessage('Docs feature coming soon - use MCP client integration');
    }
}

/**
 * Deactivate the extension
 */
function deactivate() {
    stopMCPServer();
}

module.exports = {
    activate,
    deactivate
};
