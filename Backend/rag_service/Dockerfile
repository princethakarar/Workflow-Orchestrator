# ── Render FREE tier optimized Dockerfile ──────────────────────────────────────
# Python 3.11 slim to match runtime.txt and ensure CPU torch wheels resolve.
FROM python:3.11-slim

# System deps for PyMuPDF (C extensions) and ChromaDB (SQLite)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install CPU-only dependencies (layer cached)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-fetch the ONNX MiniLM model at BUILD time (~80 MB). Without this every
# cold container downloads it on the first request, because Render's filesystem
# is ephemeral and the ~/.cache/chroma directory does not survive a restart.
RUN python -c "from chromadb.utils import embedding_functions as ef; ef.ONNXMiniLM_L6_V2()(['warmup'])"

COPY . .

# Single-threaded native execution and a capped malloc arena count: this service
# runs under a 512 MB RSS limit and threads are the main source of hidden RSS.
ENV OMP_NUM_THREADS=1 \
    ORT_NUM_THREADS=1 \
    MALLOC_ARENA_MAX=2 \
    TOKENIZERS_PARALLELISM=false \
    PYTHONUNBUFFERED=1

# Render sets PORT dynamically
EXPOSE 5001

# Production WSGI server (app.py's app.run() is the Werkzeug DEV server and is
# now local-development only).
#   --workers 1   the MiniLM model + torch runtime is resident per worker; one
#                 worker is all the free tier's memory allows
#   --threads 2   lets GET /health answer while a PDF is being embedded, so the
#                 keep-alive ping does not time out behind a slow upload
#   --timeout 120 matches AbortSignal.timeout(120_000) on the Node client, so
#                 the two sides give up at the same point instead of the caller
#                 hanging on a worker that was already killed
# Shell form is required so ${PORT} is expanded at runtime.
CMD gunicorn --bind 0.0.0.0:${PORT:-5001} --workers 1 --threads 2 --timeout 120 --access-logfile - app:app
