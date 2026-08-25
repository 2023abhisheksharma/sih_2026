#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "Starting Antarctic Navigation 3D Operations Console"
echo "=========================================================="

cd "$(dirname "$0")/../frontend"

# Start Vite React Dev Server on port 5173
npm run dev
