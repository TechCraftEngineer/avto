#!/bin/bash

# Clean build script for selectio project
# This script cleans up Next.js locks and cache to prevent build conflicts

echo "🧹 Cleaning Next.js build artifacts..."

# Find and remove all .next directories
find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true

# Find and remove lock files
find . -name "lock" -type f -path "*/.next/*" -delete 2>/dev/null || true

# Clean turbo cache if needed
if [ "$1" = "--full" ]; then
    echo "🧽 Full clean - removing turbo cache..."
    rm -rf .turbo
fi

echo "✅ Build artifacts cleaned successfully!"