#!/bin/bash

# Remove .next directory
echo "Removing .next directory..."
rm -rf .next

# Remove node_modules
echo "Removing node_modules..."
rm -rf node_modules

# Remove package-lock.json
echo "Removing package-lock.json..."
rm -f package-lock.json

# Optional: Remove yarn.lock if you're using Yarn
# rm -f yarn.lock

echo "Cache and dependencies cleared successfully!"
echo "Run 'npm install' to reinstall dependencies." 