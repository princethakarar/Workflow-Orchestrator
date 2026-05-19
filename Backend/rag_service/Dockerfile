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

# Render sets PORT dynamically; app.py reads os.environ["PORT"]
EXPOSE 5001

CMD ["python", "app.py"]
