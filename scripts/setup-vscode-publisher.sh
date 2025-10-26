#!/bin/bash

# Create or verify VS Code Marketplace Publisher
# This script helps you create the publisher account needed for publishing extensions

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

cd "$(dirname "$0")/../vscode-extension"

PUBLISHER=$(node -p "require('./package.json').publisher")

echo -e "${BLUE}📋 VS Code Marketplace Publisher Setup${NC}"
echo ""
echo -e "${YELLOW}Publisher ID needed: ${PUBLISHER}${NC}"
echo ""

echo -e "${BLUE}Step 1: Create Publisher Account${NC}"
echo -e "   1. Go to: ${YELLOW}https://marketplace.visualstudio.com/manage${NC}"
echo -e "   2. Sign in with Microsoft account"
echo -e "   3. Click ${GREEN}+ Create Publisher${NC}"
echo -e "   4. Fill in:"
echo -e "      - ID: ${YELLOW}${PUBLISHER}${NC} (must match exactly!)"
echo -e "      - Name: ${YELLOW}Your display name${NC}"
echo -e "      - Email: ${YELLOW}Your email${NC}"
echo ""

echo -e "${BLUE}Step 2: Create Personal Access Token (PAT)${NC}"
echo -e "   1. Go to: ${YELLOW}https://dev.azure.com/_usersSettings/tokens${NC}"
echo -e "   2. Click ${GREEN}+ New Token${NC}"
echo -e "   3. Configure:"
echo -e "      - Name: ${YELLOW}VSCode-Marketplace-ZigNet${NC}"
echo -e "      - Organization: ${YELLOW}All accessible organizations${NC}"
echo -e "      - Expiration: ${YELLOW}90 days${NC} (or your preference)"
echo -e "      - Scopes: ${GREEN}Custom defined${NC}"
echo -e "        ↳ Find ${YELLOW}Marketplace${NC}"
echo -e "        ↳ Check ${GREEN}✓ Manage${NC}"
echo -e "   4. Click ${GREEN}Create${NC} and ${RED}COPY THE TOKEN IMMEDIATELY${NC}"
echo ""

echo -e "${BLUE}Step 3: Save the Token${NC}"
echo ""
read -p "Do you want to save the PAT now? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if ! command -v vsce &> /dev/null; then
        echo -e "${RED}❌ vsce not found${NC}"
        echo -e "${YELLOW}Install with: npm install -g @vscode/vsce${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${YELLOW}This will prompt for your PAT and save it for future use${NC}"
    vsce login "$PUBLISHER"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Token saved successfully!${NC}"
        echo -e "${GREEN}You can now publish with: ${YELLOW}pnpm run package:vscode${NC}"
    else
        echo ""
        echo -e "${RED}❌ Failed to save token${NC}"
        echo -e "${YELLOW}Check that:${NC}"
        echo -e "${YELLOW}   1. Publisher '${PUBLISHER}' exists on marketplace${NC}"
        echo -e "${YELLOW}   2. PAT has 'Marketplace: Manage' scope${NC}"
        echo -e "${YELLOW}   3. PAT is not expired${NC}"
    fi
else
    echo ""
    echo -e "${YELLOW}ℹ️  No problem! You can save it later with:${NC}"
    echo -e "   ${YELLOW}cd vscode-extension && vsce login ${PUBLISHER}${NC}"
fi

echo ""
echo -e "${GREEN}✅ Setup guide complete${NC}"
