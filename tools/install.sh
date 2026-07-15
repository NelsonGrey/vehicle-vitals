#!/bin/bash

# Vehicle-Vitals - Memory-Optimized Installation Script
# This script ensures npm install runs without memory issues

echo "🚗 Vehicle-Vitals - Starting optimized installation..."

# Check if Node.js version is compatible
NODE_VERSION=$(node --version | sed 's/v//')
REQUIRED_MAJOR=20

if [[ ! "$NODE_VERSION" =~ ^$REQUIRED_MAJOR ]]; then
    echo "⚠️  Warning: Node.js version $NODE_VERSION detected. Recommended: v20.x"
    echo "   Consider using 'nvm use 20' if you have nvm installed"
fi

# Check available memory
MEMORY_KB=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
MEMORY_GB=$((MEMORY_KB / 1024 / 1024))

if [ $MEMORY_GB -lt 4 ]; then
    echo "⚠️  Warning: Low memory detected (${MEMORY_GB}GB available)"
    echo "   Installation may be slow. Consider closing other applications."
fi

# Clean existing installations
echo "🧹 Cleaning existing node_modules..."
rm -rf node_modules packages/web/node_modules

# Install with memory optimization and timeout protection
echo "📦 Installing dependencies with memory optimization..."

# Install root dependencies first
echo "📦 Installing root dependencies..."
if NODE_OPTIONS="--max-old-space-size=4096" npm install --ignore-scripts --no-audit --no-fund; then
    echo "✅ Root dependencies installed successfully!"
else
    echo "❌ Root installation failed."
    exit 1
fi

# Install web workspace dependencies
echo "📦 Installing web workspace dependencies..."
cd packages/web
if NODE_OPTIONS="--max-old-space-size=4096" npm install --ignore-scripts --no-audit --no-fund; then
    echo "✅ Web dependencies installed successfully!"
    cd ../..
else
    echo "❌ Web installation failed."
    cd ../..
    exit 1
fi

echo "✅ Installation completed successfully!"
echo ""
echo "🎯 Quick start commands:"
echo "   npm run dev:web     # Start web development server"
echo "   npm run build:web   # Build web application"
echo "   npm run export:logo # Export logo assets"