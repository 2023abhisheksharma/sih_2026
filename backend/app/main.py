"""
Antarctic Navigation Decision Support System - Main Backend Application.
FastAPI service exposing environmental intelligence, hybrid ML trajectory forecasting,
multi-objective route optimization, and time-based simulation.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.endpoints import router as api_router

app = FastAPI(
    title="Antarctic Navigation Decision Support API",
    description="AI-Enabled Sea-Ice, Iceberg Trajectory, and Route Optimization System for Research Vessels.",
    version="1.0.0",
)

# Enable CORS for local development and demo frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from fastapi.staticfiles import StaticFiles

# Include API Router
app.include_router(api_router)

# Mount frontend build if dist folder exists (e.g. Docker, Hugging Face, Render single-container)
dist_dir = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
if os.path.exists(dist_dir):
    app.mount("/", StaticFiles(directory=dist_dir, html=True), name="static")
else:
    @app.get("/")
    def root():
        return {
            "system": "AI-Enabled Antarctic Navigation Decision Support System",
            "status": "ONLINE",
            "docs_url": "/docs",
            "health_check": "/health",
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
