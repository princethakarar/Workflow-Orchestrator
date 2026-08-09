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

COPY . .

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
