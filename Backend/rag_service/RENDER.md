# Render deployment — RAG service

**The `Dockerfile` in this directory is NOT what Render runs.**

The Render service (`rag-service-uepk`) is a **native Python runtime** service
created from GitHub with root directory `Backend/rag_service`. Render only reads
a `Dockerfile` for services whose runtime is *Docker*; for a language runtime it
auto-detects `requirements.txt` and ignores the `Dockerfile` entirely.

Keep the `Dockerfile` for local container runs, but **every setting below has to
be maintained by hand in the Render dashboard** — nothing in this repo applies it.

## Symptom this configuration fixes

Backend → RAG calls returning `503 Service Unavailable`.

Diagnosis, for the record: `curl -D -` against the live service returned
`x-render-origin-server: Werkzeug/3.1.8 Python/3.14.3`. That is the Flask *dev*
server on Python 3.14 — proof the `Dockerfile` (`FROM python:3.11-slim`,
`CMD gunicorn …`) and `runtime.txt` (`python-3.11.9`, which Render deprecated in
favour of `PYTHON_VERSION`) were both being ignored. Consequences:

1. The build-time ONNX model prefetch never ran, so every cold container
   downloaded ~80 MB of MiniLM before it could answer. A measured cold start took
   **41.9 s** to first byte; Render's edge serves 503 during that window.
2. `MALLOC_ARENA_MAX` was a no-op — glibc reads it at process start, before
   Python runs, so `os.environ.setdefault` in `app.py` could never take effect.
   The RSS guard from the ONNX/OOM migration was inert, and OOM restarts produce
   more 503s.
3. The dev server ran with no request timeout, so the 120 s pairing between
   gunicorn and `AbortSignal.timeout` on the Node side did not hold.

## Required dashboard settings

**Settings → Build & Deploy**

Build command — installs deps *and* warms the ONNX model into the cache so cold
starts don't pay for the download:

```
pip install -r requirements.txt && python -c "from chromadb.utils import embedding_functions as ef; ef.ONNXMiniLM_L6_V2()(['warmup'])"
```

Start command — mirrors the `Dockerfile` CMD. One worker (the model is resident
per worker), two threads so `GET /health` answers while a PDF is embedding, and
`--timeout 120` to match `RAG_REQUEST_TIMEOUT_MS` in `Backend/src/config/ragConfig.js`:

```
gunicorn --bind 0.0.0.0:$PORT --workers 1 --threads 2 --timeout 120 --access-logfile - app:app
```

**Settings → Environment**

| Key | Value | Why |
| --- | --- | --- |
| `PYTHON_VERSION` | `3.11.9` | Replaces the ignored `runtime.txt`. 3.14 is not what the deps were pinned against, and pymupdf may lack a wheel for it. |
| `HOME` | `/opt/render/project/src` | chromadb caches the ONNX model at `Path.home()/.cache/chroma/onnx_models/` (`onnx_mini_lm_l6_v2.py:39`). Pointing `HOME` into the persisted checkout is what carries the build-command prefetch through to runtime. |
| `MALLOC_ARENA_MAX` | `2` | Caps glibc per-thread arenas. Must be set here — see point 2 above. |
| `OMP_NUM_THREADS` | `1` | Single-threaded native execution on a 0.1-CPU instance. |
| `ORT_NUM_THREADS` | `1` | Same, for ONNX Runtime. |
| `TOKENIZERS_PARALLELISM` | `false` | Suppresses tokenizer fork warnings / spikes. |
| `GROQ_API_KEY` | *(secret)* | LLM calls. |
| `GROQ_MODEL` | *(as configured)* | |
| `RAG_SHARED_SECRET` | *(secret)* | Must equal `RAG_SHARED_SECRET` on the Node backend. |

## Verifying after the redeploy

```
curl -s -D - -o /dev/null https://rag-service-uepk.onrender.com/health
```

- `x-render-origin-server` must read **`gunicorn/…`**, not `Werkzeug/…`. If it
  still says Werkzeug, the start command did not take.
- Let the instance idle >15 min to spin down, then time a cold request:
  `curl -s -o /dev/null -w "%{time_total}\n" …/health`. It should land well under
  the 41.9 s baseline. If it doesn't, the `HOME` override isn't carrying the
  prefetched model through and the download is still happening per cold start.

## Why this is not in `render.yaml`

The root `render.yaml` blueprint manages the Node backend and the static
frontend. The RAG service was created by hand in the dashboard, and a Render
blueprint only manages services it created — adding a `rag-service` entry there
would spin up a *second*, separate service rather than adopt this one, and the
backend's `RAG_SERVICE_URL` would still point at the old one.
