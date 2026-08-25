#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "Starting Antarctic Navigation Decision Support Backend API"
echo "=========================================================="

cd "$(dirname "$0")/.."
export PYTHONPATH=.

# Start FastAPI uvicorn server on port 8000
python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
