#!/bin/bash

# Tag and Push Script
# Creates a git tag based on package.json version and pushes it to GitHub

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")

if [ -z "$VERSION" ]; then
    echo -e "${RED}❌ Failed to read version from package.json${NC}"
    exit 1
fi

TAG="v${VERSION}"

echo -e "${YELLOW}📋 Current version: ${VERSION}${NC}"
echo -e "${YELLOW}🏷️  Tag to create: ${TAG}${NC}"
echo ""

# Check if tag already exists locally
if git rev-parse "$TAG" >/dev/null 2>&1; then
    echo -e "${RED}❌ Tag ${TAG} already exists locally${NC}"
    echo -e "${YELLOW}ℹ️  To delete it: git tag -d ${TAG}${NC}"
    exit 1
fi

# Check if tag exists on remote
if git ls-remote --tags origin | grep -q "refs/tags/${TAG}"; then
    echo -e "${RED}❌ Tag ${TAG} already exists on remote${NC}"
    echo -e "${YELLOW}ℹ️  To delete it from remote: git push origin :refs/tags/${TAG}${NC}"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}❌ You have uncommitted changes${NC}"
    echo -e "${YELLOW}ℹ️  Please commit or stash your changes first${NC}"
    exit 1
fi

# Create the tag
echo -e "${GREEN}🏷️  Creating tag ${TAG}...${NC}"
git tag -a "$TAG" -m "Release $VERSION"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Tag created successfully${NC}"
else
    echo -e "${RED}❌ Failed to create tag${NC}"
    exit 1
fi

# Push the tag to origin
echo -e "${GREEN}📤 Pushing tag to GitHub...${NC}"
git push origin "$TAG"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Tag pushed successfully to GitHub${NC}"
    echo ""
    echo -e "${GREEN}🎉 Release ${TAG} is now on GitHub!${NC}"
    echo -e "${YELLOW}📍 View at: https://github.com/fulgidus/zignet/releases/tag/${TAG}${NC}"
else
    echo -e "${RED}❌ Failed to push tag${NC}"
    echo -e "${YELLOW}ℹ️  Tag exists locally. To remove: git tag -d ${TAG}${NC}"
    exit 1
fi
