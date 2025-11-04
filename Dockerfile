# Railway deployment Dockerfile for FastAPI backend
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# System deps (minimal)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install backend deps first for layer caching
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install -r /app/backend/requirements.txt

# Copy backend code
COPY backend /app/backend

EXPOSE 8001

# Start: respect Railway $PORT, default 8001
CMD ["bash", "-lc", "python -m uvicorn backend.server:app --host 0.0.0.0 --port ${PORT:-8001}"]
