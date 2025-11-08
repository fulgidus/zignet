# Change Log

All notable changes to the "zignet" extension will be documented in this file.

## [0.15.3] - 2025-11-08

### Fixed
- **Critical**: Fixed "Please open a Zig file first" error when commands are run on open .zig files
- Added native Zig language support configuration to properly register `.zig` file extension
- Extension now works standalone without requiring other Zig extensions

### Added
- Language configuration for Zig files (bracket matching, auto-closing pairs, comment tokens)
- Improved documentation with troubleshooting guide for language detection issues

## [0.15.2] - 2025-10-26

### Added
- Initial release of ZigNet VS Code extension
- MCP server integration with automatic startup
- Support for Zig 0.13.0, 0.14.0, and 0.15.2
- Commands for code analysis, formatting, and documentation
- Configuration options for Zig version and model path
- Auto-download of fine-tuned LLM model (4.4GB)
- Context menu integration for Zig files

### Features
- Real-time code analysis with official Zig compiler
- Smart code formatting with zig fmt
- AI-powered documentation lookup
- Intelligent error fix suggestions
- Output panel for server logs
