#!/bin/bash
set -e

echo "Installing LUMA - Layout & UX Mockup Analyzer..."

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required but not installed."
    echo "Please install Node.js >= 18.0.0 from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "Error: Node.js 18.0.0 or higher is required."
    echo "Current version: $(node -v)"
    exit 1
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
