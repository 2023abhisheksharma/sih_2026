"""
Root Entrypoint for Cloud Hosting (Hugging Face Spaces, Render, Koyeb).
Binds FastAPI application to dynamic PORT (default 7860 for Hugging Face, or Render's $PORT).
"""

import os
import sys
import uvicorn

# Ensure project root is in Python module search path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from backend.app.main import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, reload=False)
