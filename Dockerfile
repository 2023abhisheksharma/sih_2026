# ==============================================================================
# Multi-stage Dockerfile for Antarctic Navigation Decision Support System
# Compatible with Hugging Face Spaces (CPU 16GB Free Tier), Render, and Koyeb
# ==============================================================================

# Stage 1: Build React 19 + Cesium Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci || npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend Runtime
FROM python:3.11-slim AS runtime
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PORT=7860

# Install system dependencies for geospatial libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgeos-dev \
    libproj-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend, ML models, and data
COPY backend/ ./backend/
COPY ml/ ./ml/
COPY data/ ./data/
COPY research/ ./research/

# Copy compiled frontend from Stage 1 into /app/frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose default port (7860 for Hugging Face, or Render dynamic $PORT)
EXPOSE 7860

# Start FastAPI with Uvicorn
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
