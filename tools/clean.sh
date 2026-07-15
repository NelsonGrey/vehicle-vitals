#!/bin/bash

# Vehicle-Vitals - Clean Installation Script
# Use this script when npm install hangs or fails

echo "🧹 Vehicle-Vitals - Cleaning installation artifacts..."

# Kill any hanging npm processes
echo "🔄 Stopping any running npm processes..."
pkill -f "npm" 2>/dev/null || true

# Remove all node_modules and lock files
echo "🗑️  Removing node_modules and lock files..."
rm -rf node_modules
rm -rf packages/web/node_modules  
rm -rf package-lock.json
rm -rf packages/web/package-lock.json

# Clear npm cache
echo "💾 Clearing npm cache..."
npm cache clean --force 2>/dev/null || true

# Remove temporary files
echo "🧽 Cleaning temporary files..."
rm -rf /tmp/.npm-* 2>/dev/null || true
rm -rf ~/.npm/_locks 2>/dev/null || true

echo "✅ Cleanup completed!"
echo ""
echo "🚀 Now run: ./install.sh"