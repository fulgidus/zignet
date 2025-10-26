#!/bin/bash

# Package and Publish VS Code Extension
# This script packages the ZigNet VS Code extension and optionally publishes it

set -e

cd "$(dirname "$0")/../vscode-extension"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📦 ZigNet VS Code Extension Packager${NC}"
echo ""

# Verify we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "extension.js" ]; then
    echo -e "${RED}❌ Not in vscode-extension directory${NC}"
    echo -e "${YELLOW}Current dir: $(pwd)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Working directory: $(pwd)${NC}"

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
PUBLISHER=$(node -p "require('./package.json').publisher")
echo -e "${YELLOW}Version: ${VERSION}${NC}"
echo -e "${YELLOW}Publisher: ${PUBLISHER}${NC}"

# Check if vsce is installed
if ! command -v vsce &> /dev/null; then
    echo -e "${RED}❌ vsce not found${NC}"
    echo -e "${YELLOW}Install with: npm install -g @vscode/vsce${NC}"
    exit 1
fi

# Clean old packages
rm -f *.vsix
echo -e "${GREEN}✅ Cleaned old packages${NC}"

# Package the extension
echo -e "${BLUE}📦 Packaging extension...${NC}"
vsce package

if [ $? -eq 0 ]; then
    VSIX_FILE="zignet-${VERSION}.vsix"
    echo -e "${GREEN}✅ Package created: ${VSIX_FILE}${NC}"
    echo ""
    
    # Ask if user wants to publish
    read -p "Do you want to publish to VS Code Marketplace? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo -e "${YELLOW}⚠️  Before publishing, ensure you have:${NC}"
        echo -e "${YELLOW}   1. Created publisher '${PUBLISHER}' at https://marketplace.visualstudio.com/manage${NC}"
        echo -e "${YELLOW}   2. Generated a PAT with 'Marketplace: Manage' scope${NC}"
        echo ""
        read -p "Continue with publish? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}ℹ️  Package created but not published${NC}"
            echo -e "${YELLOW}To publish later:${NC}"
            echo -e "${YELLOW}   cd vscode-extension${NC}"
            echo -e "${YELLOW}   vsce publish${NC}"
            exit 0
        fi
        
        echo -e "${BLUE}📤 Publishing to marketplace...${NC}"
        vsce publish
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Published successfully!${NC}"
            echo -e "${YELLOW}View at: https://marketplace.visualstudio.com/items?itemName=fulgidus.zignet${NC}"
        else
            echo -e "${RED}❌ Publish failed${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}ℹ️  Package created but not published${NC}"
        echo -e "${YELLOW}To publish later: cd vscode-extension && vsce publish${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}📍 Local installation (for testing):${NC}"
    echo -e "   code --install-extension ${VSIX_FILE}"
else
    echo -e "${RED}❌ Packaging failed${NC}"
    exit 1
fi
