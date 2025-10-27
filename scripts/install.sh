#!/bin/bash
set -e

echo "Installing LUMA - Layout & UX Mockup Analyzer..."

# Check for Node.js - try multiple methods for cross-platform compatibility
# Try direct execution first (most reliable on Windows)
if node -v &> /dev/null 2>&1; then
    NODE_CMD="node"
elif node.exe -v &> /dev/null 2>&1; then
    NODE_CMD="node.exe"
elif command -v node &> /dev/null; then
    NODE_CMD="node"
elif command -v node.exe &> /dev/null; then
    NODE_CMD="node.exe"
elif which node &> /dev/null; then
    NODE_CMD="node"
else
    echo "Error: Node.js is required but not installed."
    echo "Please install Node.js >= 18.0.0 from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$($NODE_CMD -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "Error: Node.js 18.0.0 or higher is required."
    echo "Current version: $($NODE_CMD -v)"
    exit 1
fi

echo "Found Node.js $($NODE_CMD -v) ✓"

# Check if LUMA is already installed
if command -v luma &> /dev/null; then
    echo "Existing LUMA installation detected"
    echo "Uninstalling previous version..."
    npm unlink -g luma 2>/dev/null || true
fi

# Clone repository
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"
echo "Cloning LUMA repository..."
git clone https://github.com/JohanBellander/luma.git
cd luma

# Install dependencies
echo "Installing dependencies..."
npm install --silent

# Build
echo "Building LUMA..."
npm run build

# Install globally
echo "Installing LUMA globally..."
npm link

# Cleanup
cd ~
rm -rf "$TEMP_DIR"

echo ""
echo "✅ LUMA installed successfully!"
echo ""
echo "Try: luma --help"
echo "Quick start: luma capabilities"
