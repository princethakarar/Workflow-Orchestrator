# Use Python 3.10 slim image for a balance of size and compatibility
FROM python:3.10-slim

# Install system dependencies required for PyMuPDF and ChromaDB
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port the Flask app runs on
EXPOSE 5001

# Start the RAG service
CMD ["python", "app.py"]
