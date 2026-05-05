FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/app/.cache/huggingface \
    XDG_CACHE_HOME=/app/.cache

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app ./app

# Make the runtime data dirs writable on platforms (HF Spaces) where the
# Dockerfile is the source of truth for permissions.
RUN mkdir -p /app/media /app/data /app/.cache && chmod -R 777 /app/media /app/data /app/.cache

# Honour the platform-provided $PORT (HF Spaces → 7860, Render → 10000,
# local docker-compose → 8000). Fall back to 8000 for local runs.
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
