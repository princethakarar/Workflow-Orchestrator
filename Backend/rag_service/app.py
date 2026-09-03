import os

# ══════════════════════════════════════════════════════════════════════════════
# Import-order-critical preamble — DO NOT reorder, and DO NOT move any import
# above this block.
#
#   1. load_dotenv()  — local-dev config (GROQ_API_KEY, GROQ_MODEL,
#                       RAG_SHARED_SECRET). On Render these come from the
#                       dashboard and no .env file exists.
#   2. Threading / device env — must be set BEFORE the first import that starts
#      a native runtime. Embeddings now run on ONNX Runtime rather than torch,
#      so the lever is OMP_NUM_THREADS; onnxruntime reads it at import time.
# ══════════════════════════════════════════════════════════════════════════════
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

# Single-threaded native execution. Extra threads buy nothing on a 0.1-CPU free
# instance and each one costs stack + arena memory, which is the binding
# constraint here (Render free tier caps the service at 512 MB RSS).
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("ORT_NUM_THREADS", "1")
# Caps glibc's per-thread malloc arenas. Without it a threaded process can hold
# a large amount of freed-but-unreturned heap, inflating RSS well past live size.
#
# WARNING: setting this here is a NO-OP for the running process. glibc reads
# MALLOC_ARENA_MAX once, at process start, before Python exists. It must be set
# in the environment that *launches* the interpreter — on Render that means a
# dashboard env var (see RENDER.md), not this line. Kept only so a local
# `python app.py` run passes it down to any child process it spawns.
os.environ.setdefault("MALLOC_ARENA_MAX", "2")
# Defensive: nothing here loads CUDA any more, but keep GPU discovery off.
os.environ["CUDA_VISIBLE_DEVICES"] = ""
# Disable parallelism in Hugging Face tokenizers to prevent memory leak warnings/spikes
os.environ["TOKENIZERS_PARALLELISM"] = "false"

from flask import Flask, request, jsonify
from flask_cors import CORS
import fitz          # PyMuPDF
import chromadb
import hashlib
import hmac
import re
import logging

from chromadb.utils import embedding_functions as chroma_embedding_functions
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_chroma import Chroma
from langchain_groq import ChatGroq

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ── App ───────────────────────────────────────────────────────────────────────
app = Flask(__name__)

# ── Access control ────────────────────────────────────────────────────────────
# This service is reachable from the public internet (Render). Every route,
# including DELETE /cache, is gated on a shared secret sent by the Node backend.
#
# Rollout order matters: set RAG_SHARED_SECRET on the Node service FIRST (it
# starts sending the header, which an un-configured RAG service ignores), then
# on this service. Enforcement therefore begins without an outage window.
# While unset, the service stays open and logs a warning on every start.
RAG_SHARED_SECRET = os.environ.get("RAG_SHARED_SECRET", "").strip()
RAG_SECRET_HEADER = "X-RAG-Secret"

if RAG_SHARED_SECRET:
    log.info("Shared-secret auth ENABLED (header: %s)", RAG_SECRET_HEADER)
else:
    log.warning(
        "RAG_SHARED_SECRET is not set — this service is OPEN to anyone who can "
        "reach it, including DELETE /cache. Set it on the Node service, then here."
    )

# CORS: nothing in this system calls the RAG service from a browser — the React
# app talks to the Node backend, which proxies here server-to-server (where CORS
# does not apply). Default is therefore "no cross-origin browser access at all";
# set RAG_ALLOWED_ORIGINS (comma-separated) to re-enable it for debugging.
_cors_origins = [o.strip() for o in os.environ.get("RAG_ALLOWED_ORIGINS", "").split(",") if o.strip()]
if _cors_origins:
    CORS(app, origins=_cors_origins)
    log.warning("CORS enabled for origins: %s", _cors_origins)
else:
    log.info("CORS disabled — server-to-server access only")


@app.before_request
def require_shared_secret():
    """Reject unauthenticated calls to every route when a secret is configured."""
    if request.method == "OPTIONS":
        return None

    if not RAG_SHARED_SECRET:
        return None  # not configured yet — see rollout note above

    # GET /health stays open: it is the documented keep-alive target for the
    # external cron pinger and performs no work and no mutation. Its response is
    # trimmed for unauthenticated callers (see the health route).
    if request.endpoint == "health" and request.method == "GET":
        return None

    supplied = request.headers.get(RAG_SECRET_HEADER, "")
    if not hmac.compare_digest(supplied, RAG_SHARED_SECRET):
        log.warning("Rejected unauthenticated %s %s", request.method, request.path)
        return jsonify({"error": "Unauthorized"}), 401

    return None


def _request_is_authenticated() -> bool:
    if not RAG_SHARED_SECRET:
        return False
    return hmac.compare_digest(request.headers.get(RAG_SECRET_HEADER, ""), RAG_SHARED_SECRET)


# ── Embeddings (ONNX Runtime, CPU-only) ───────────────────────────────────────
# Same model as before — all-MiniLM-L6-v2, 384 dimensions — but executed by
# ONNX Runtime instead of torch + sentence-transformers.
#
# WHY: the free Render instance is capped at 512 MB RSS and the torch path
# peaked at ~559 MB, which is the OOM. Measured contributions were torch 171 MB
# + model weights 124 MB + a 69 MB inference spike. The ONNX path peaks at
# ~293 MB and pulls in no new dependency: onnxruntime already ships as a
# chromadb dependency.
#
# EQUIVALENCE: verified against validation/golden_chunks_v1.json — cosine
# similarity 1.000000 against the torch baseline on all 10 frozen vectors.
# The ONNX function L2-normalises its output where the torch path did not, but
# cosine distance is scale-invariant and the collections are created with
# hnsw:space=cosine, so retrieval ordering is unaffected. Only raw vector
# magnitudes differ.
EMBED_MODEL_NAME = "all-MiniLM-L6-v2 (ONNX Runtime)"


class OnnxMiniLMEmbeddings(Embeddings):
    """LangChain Embeddings backed by ChromaDB's bundled ONNX MiniLM.

    Implements the same interface HuggingFaceEmbeddings did, so langchain_chroma
    and the rest of the chain are unchanged. The model is fetched to
    ~/.cache/chroma/onnx_models on first use; the Dockerfile pre-warms it at
    build time so a cold container does not pay the download.
    """

    # ONNX Runtime sizes its allocation arena from the largest batch it is
    # handed, and the underlying function embeds whatever list it is given in
    # one go. Measured unbatched: 10 chunks -> 348 MB peak, 25 -> 556 MB,
    # 100 -> 822 MB. Feeding it fixed-size batches keeps the peak flat and
    # independent of document length, which is what keeps a large PDF inside
    # the 512 MB cap.
    BATCH_SIZE = 8

    def __init__(self):
        self._fn = chroma_embedding_functions.ONNXMiniLM_L6_V2()

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        texts = list(texts)
        vectors: list[list[float]] = []
        for start in range(0, len(texts), self.BATCH_SIZE):
            batch = texts[start:start + self.BATCH_SIZE]
            vectors.extend([float(x) for x in vector] for vector in self._fn(batch))
        return vectors

    def embed_query(self, text: str) -> list[float]:
        return self.embed_documents([text])[0]


log.info("Loading embeddings (%s)…", EMBED_MODEL_NAME)
EMBEDDINGS = OnnxMiniLMEmbeddings()
log.info("Embedding model ready ✓")

# ── Persistent ChromaDB Client ────────────────────────────────────────────────
CHROMA_DB_PATH = os.path.join(os.path.dirname(__file__), "chroma_db")
os.makedirs(CHROMA_DB_PATH, exist_ok=True)

# Storage modes. The in-memory fallback is invisible from the outside — a
# fallback client answers list_collections() perfectly happily — so the mode is
# tracked explicitly and surfaced by /health instead of being inferred.
CHROMA_MODE_PERSISTENT = "persistent"
CHROMA_MODE_FALLBACK   = "in_memory_fallback"


def init_chroma():
    """Initialize ChromaDB client with fallback for common corruption issues.

    Returns (client, mode, error). NOTE: *any* failure to open the persistent
    store degrades to in-memory — not just the two corruption signatures named
    below (permissions, disk-full and schema errors land here too), which is why
    the caller must propagate `mode` rather than assume corruption.
    """
    try:
        client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
        # Verify it works
        client.list_collections()
        return client, CHROMA_MODE_PERSISTENT, None
    except Exception as e:
        log.error(f"ChromaDB initialization failed: {e}")
        if "table collections already exists" in str(e) or "database disk image is malformed" in str(e):
            log.critical(
                "ChromaDB persistent storage is CORRUPTED — running IN-MEMORY. "
                "Every upload will re-embed and nothing survives a restart."
            )
            log.info("TIP: To fix permanently, delete the 'Backend/rag_service/chroma_db' directory.")
        else:
            log.critical(
                "ChromaDB persistent storage is UNAVAILABLE — running IN-MEMORY. "
                "Every upload will re-embed and nothing survives a restart."
            )
        return chromadb.Client(), CHROMA_MODE_FALLBACK, str(e)  # In-memory fallback

CHROMA_CLIENT, CHROMA_MODE, CHROMA_INIT_ERROR = init_chroma()
log.info("ChromaDB client initialized ✓ (mode=%s)", CHROMA_MODE)

# ── Tuning Constants ──────────────────────────────────────────────────────────
TOP_K          = 10
MIN_CHUNK_CHARS = 300
MAX_CHUNK_CHARS = 1800
OVERLAP_WORDS   = 40

# Separator inserted between a chunk's overlap prefix and its own body.
OVERLAP_SEP = " … "

# ── LLM Constants ─────────────────────────────────────────────────────────────
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

# Ceiling on generated tokens. Measured from the 35 real completions logged in
# Backend/datasets/fine_tuning_dataset.jsonl: p50 ≈ 1,935 tokens, p90 ≈ 2,014,
# max ≈ 2,892 (chars/3.6). Raised from 8192 → 16384 because the current model
# (openai/gpt-oss-120b) is a reasoning model: it consumes part of this budget on
# internal chain-of-thought before producing the final JSON, so the effective
# output headroom shrinks by however many tokens the reasoning trace uses.
# 16384 preserves ~2.8x headroom over the largest observed plan while leaving
# room for the reasoning trace without hitting the model's completion window.
GROQ_MAX_TOKENS = 16384

# Client-level timeout. Must leave room inside the callers' budgets: the Node
# fetch aborts at 120s and gunicorn kills the worker at 120s, and this call is
# only the last stage of extract → chunk → embed → retrieve → generate.
GROQ_TIMEOUT_SECONDS = 60

# No SDK-level retries. With request_timeout=60 and max_retries=2, a single slow
# generation could consume up to ~180s — past both the gunicorn worker timeout
# and the Node client's AbortSignal, so the caller would be gone before the
# retries finished. Failures are surfaced immediately instead; aiController.js
# maps them to a 502 with a "retry in a moment" hint.
GROQ_MAX_RETRIES = 0


# ══════════════════════════════════════════════════════════════════════════════
# Chunking — paragraph + sentence boundary aware
# ══════════════════════════════════════════════════════════════════════════════

def _split_sentences(text: str) -> list[str]:
    """Naïve but fast sentence splitter (avoids heavy NLTK dependency)."""
    parts = re.split(r'(?<=[.!?])\s+(?=[A-Z\d"\'])', text)
    return [p.strip() for p in parts if p.strip()]


def _hard_split(text: str, max_len: int) -> list[str]:
    """Last-resort split for text with no usable sentence boundary.

    Bullet lists, tables and headings routinely contain no ".!?" followed by a
    capital, so the sentence splitter returns them as one giant unit. Previously
    such text escaped the size check entirely; now it is cut on the nearest word
    boundary, falling back to a raw character slice if a single "word" is itself
    longer than the budget.
    """
    pieces: list[str] = []
    remaining = text.strip()
    while len(remaining) > max_len:
        window = remaining[:max_len]
        cut = window.rfind(" ")
        if cut < max_len // 2:      # no sensible word boundary in range
            cut = max_len
        pieces.append(remaining[:cut].strip())
        remaining = remaining[cut:].strip()
    if remaining:
        pieces.append(remaining)
    return [p for p in pieces if p]


def extract_text_with_pages(pdf_bytes: bytes) -> list[dict]:
    """
    Extract text page-by-page, returning a list of dicts:
      { "page": <int 1-based>, "text": <str> }
    Uses PyMuPDF block extraction to preserve paragraph structure.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages = []
    for page_num, page in enumerate(doc, start=1):
        # "blocks" mode groups text by layout block (paragraph-like)
        blocks = page.get_text("blocks")
        block_texts = []
        for b in blocks:
            if b[6] == 0:  # b[6] == 0 means it's a text block (not image)
                block_texts.append(b[4].strip())
        pages.append({"page": page_num, "text": "\n\n".join(block_texts)})
    doc.close()
    return pages


def _raw_blocks(pages: list[dict]) -> list[dict]:
    """Collect paragraph blocks with page provenance and running char offsets."""
    blocks: list[dict] = []
    char_cursor = 0
    for page_info in pages:
        page_num = page_info["page"]
        for para in re.split(r"\n{2,}", page_info["text"]):
            para = para.strip()
            if not para:
                continue
            blocks.append({
                "page": page_num,
                "text": para,
                "char_start": char_cursor,
            })
            char_cursor += len(para) + 2
    return blocks


def _packable_units(blocks: list[dict], max_len: int) -> list[dict]:
    """Break blocks down until every unit fits the budget.

    Whole paragraph if it fits → else sentences → else hard character slices.
    A unit is never larger than `max_len`, which is what makes the final
    "no chunk exceeds MAX_CHUNK_CHARS" guarantee reachable.
    """
    units: list[dict] = []
    for block in blocks:
        if len(block["text"]) <= max_len:
            units.append(dict(block))
            continue

        cursor = block["char_start"]
        for sent in _split_sentences(block["text"]):
            parts = [sent] if len(sent) <= max_len else _hard_split(sent, max_len)
            for part in parts:
                units.append({"page": block["page"], "text": part, "char_start": cursor})
                cursor += len(part) + 1
    return units


def _overlap_prefix(body: str, overlap_words: int) -> str:
    """The trailing `overlap_words` words of a chunk body."""
    if overlap_words <= 0:
        return ""
    words = body.split()
    if not words:
        return ""
    return " ".join(words[-overlap_words:])


def _pack(units: list[dict], max_chars: int, overlap_words: int) -> list[dict]:
    """Greedily pack units into chunk bodies, reserving room for the overlap.

    This is the fix for overlap being applied *after* the size check: the budget
    for chunk N is reduced by the exact length of the overlap prefix that chunk
    N-1 will contribute, so body + overlap stays inside max_chars instead of
    overshooting it by ~250-300 chars on every non-first chunk.
    """
    chunks: list[dict] = []
    buf, buf_page, buf_start = "", 1, 0

    def reserved() -> int:
        if not chunks:
            return 0
        prefix = _overlap_prefix(chunks[-1]["text"], overlap_words)
        return len(prefix) + len(OVERLAP_SEP) if prefix else 0

    def flush(text, page, start):
        if text.strip():
            chunks.append({
                "page": page,
                "text": text.strip(),
                "char_start": start,
                "char_end": start + len(text),
            })

    for unit in units:
        budget = max(max_chars - reserved(), 1)

        if not buf:
            buf, buf_page, buf_start = unit["text"], unit["page"], unit["char_start"]
        elif len(buf) + 2 + len(unit["text"]) <= budget:
            buf += "\n\n" + unit["text"]
        else:
            flush(buf, buf_page, buf_start)
            buf, buf_page, buf_start = unit["text"], unit["page"], unit["char_start"]

    flush(buf, buf_page, buf_start)
    return chunks


def _join_chunks(first: dict, second: dict) -> dict:
    return {
        "page": first["page"],
        "text": first["text"] + "\n\n" + second["text"],
        "char_start": first["char_start"],
        "char_end": second["char_end"],
    }


def _merge_small(chunks: list[dict], min_chars: int, max_chars: int) -> list[dict]:
    """Merge sub-min_chars chunks into a neighbour instead of discarding them.

    The old behaviour deleted every block below MIN_CHUNK_CHARS outright, so
    headings, table rows and one-line bullets never reached the index at all.
    Content is now only lost when a short chunk has no neighbour to attach to —
    i.e. it is the sole chunk in the document.
    """
    out: list[dict] = []
    pending: dict | None = None
    dropped: list[int] = []

    for chunk in chunks:
        current = chunk

        if pending is not None:
            if len(pending["text"]) + 2 + len(current["text"]) <= max_chars:
                current = _join_chunks(pending, current)
            else:
                out.append(pending)     # doesn't fit anywhere — keep, never drop
            pending = None

        if len(current["text"]) >= min_chars:
            out.append(current)
        elif out and len(out[-1]["text"]) + 2 + len(current["text"]) <= max_chars:
            out[-1] = _join_chunks(out[-1], current)
        else:
            pending = current           # try the next chunk instead

    if pending is not None:
        if out and len(out[-1]["text"]) + 2 + len(pending["text"]) <= max_chars:
            out[-1] = _join_chunks(out[-1], pending)
        elif out:
            out.append(pending)         # has neighbours, just doesn't fit
        else:
            dropped.append(len(pending["text"]))

    if dropped:
        log.warning(
            "Chunk discard: dropped %d block(s) below MIN_CHUNK_CHARS=%d with no "
            "neighbour to merge into; sizes=%s", len(dropped), min_chars, dropped
        )
    else:
        log.info("Chunk merge: no content dropped (MIN_CHUNK_CHARS=%d)", min_chars)

    return out


def _apply_overlap(chunks: list[dict], overlap_words: int, max_chars: int) -> list[dict]:
    """Prepend each chunk with the tail of the previous chunk's BODY.

    Taking the prefix from the previous *body* rather than its already-prefixed
    final text stops overlap compounding down the document, and keeps the length
    consistent with what _pack() reserved. Any residual overshoot is trimmed a
    word at a time so max_chars is a hard ceiling.
    """
    final: list[dict] = []
    for i, chunk in enumerate(chunks):
        text = chunk["text"]

        if i > 0:
            prefix = _overlap_prefix(chunks[i - 1]["text"], overlap_words)
            if prefix and not text.startswith(prefix[:30]):
                words = prefix.split()
                while words and len(" ".join(words)) + len(OVERLAP_SEP) + len(text) > max_chars:
                    words.pop(0)
                if words:
                    text = " ".join(words) + OVERLAP_SEP + text

        final.append({
            "chunk_id"  : i,
            "page_hint" : chunk["page"],
            "char_start": chunk["char_start"],
            "char_end"  : chunk["char_end"],
            "word_count": len(text.split()),
            "text"      : text,
        })
    return final


def chunk_text_smart(
    pages: list[dict],
    min_chars: int = MIN_CHUNK_CHARS,
    max_chars: int = MAX_CHUNK_CHARS,
    overlap_words: int = OVERLAP_WORDS,
) -> list[dict]:
    """
    Paragraph-aware, sentence-boundary chunking.
    Returns a list of dicts:
      {
        "text"      : str,
        "chunk_id"  : int,
        "page_hint" : int,
        "char_start": int,
        "char_end"  : int,
        "word_count": int,
      }
    """
    units  = _packable_units(_raw_blocks(pages), max_chars)
    packed = _pack(units, max_chars, overlap_words)
    merged = _merge_small(packed, min_chars, max_chars)
    return _apply_overlap(merged, overlap_words, max_chars)


def documents_from_pages(pages: list[dict]) -> list[Document]:
    """Chunk → LangChain Documents, preserving the per-chunk metadata.

    Deliberately NOT a TextSplitter subclass: split_text(str) -> list[str] cannot
    carry page_hint / char offsets / word_count, which the /rag response and the
    stored vectors both depend on.
    """
    return [
        Document(
            page_content=chunk["text"],
            metadata={
                "chunk_id"  : chunk["chunk_id"],
                "page_hint" : chunk["page_hint"],
                "char_start": chunk["char_start"],
                "char_end"  : chunk["char_end"],
                "word_count": chunk["word_count"],
            },
        )
        for chunk in chunk_text_smart(pages)
    ]


# ══════════════════════════════════════════════════════════════════════════════
# Vector store: one Chroma collection per document
# ══════════════════════════════════════════════════════════════════════════════

def _pdf_hash(pdf_bytes: bytes) -> str:
    """SHA-256 fingerprint of the PDF bytes — used as the collection name."""
    return "pdf_" + hashlib.sha256(pdf_bytes).hexdigest()[:32]


def embed_and_store(documents: list[Document], collection_name: str) -> tuple[Chroma, bool]:
    """Embed documents and store them in a per-document Chroma collection."""
    existing_names = [c.name for c in CHROMA_CLIENT.list_collections()]
    db_reused = collection_name in existing_names

    # collection_metadata MUST be passed on every construction: Chroma's default
    # space is l2, and it is only honoured at creation time. Attaching to an
    # existing collection keeps whatever it was created with.
    store = Chroma(
        client=CHROMA_CLIENT,
        collection_name=collection_name,
        embedding_function=EMBEDDINGS,
        collection_metadata={"hnsw:space": "cosine"},
    )

    if db_reused:
        log.info("Cache hit — reusing existing collection '%s'", collection_name)
        return store, True

    # Explicit IDs, namespaced by document hash. Never let Chroma auto-generate
    # UUIDs: the IDs must stay deterministic for re-ingest and dedup.
    ids = [f"{collection_name}_{d.metadata['chunk_id']}" for d in documents]

    log.info("Embedding %d chunks…", len(documents))
    store.add_documents(documents=documents, ids=ids)
    log.info("Stored %d chunks in ChromaDB ✓", len(documents))
    return store, False


# ══════════════════════════════════════════════════════════════════════════════
# Similarity Retrieval
# ══════════════════════════════════════════════════════════════════════════════

class DynamicKRetriever:
    """Similarity retriever whose k adapts to the collection size per request.

    Not a BaseRetriever subclass: that interface returns bare Documents, and this
    endpoint has to surface a per-chunk similarity score in chunk_meta. A static
    as_retriever(search_kwargs={"k": N}) is also wrong here — collections hold as
    few as one vector, so k is computed per call.
    """

    FALLBACK_QUERY = (
        "Extract all important project tasks, features, modules, technical requirements, "
        "system components, user roles, workflows, and implementation details needed to "
        "build this software project from scratch. Include functional requirements, "
        "non-functional requirements, API integrations, database design, authentication, "
        "UI screens, and deployment considerations."
    )

    def __init__(self, store: Chroma, client, collection_name: str, top_k: int = TOP_K):
        self.store = store
        self.client = client
        self.collection_name = collection_name
        self.top_k = top_k

    def count(self) -> int:
        try:
            return self.client.get_collection(self.collection_name).count()
        except Exception as e:
            log.warning("Could not count collection '%s': %s", self.collection_name, e)
            return 0

    def retrieve(self, user_query: str | None) -> list[dict]:
        primary_query = user_query.strip() if (user_query and user_query.strip()) else self.FALLBACK_QUERY

        n_available = self.count()
        if n_available == 0:
            return []

        fetch_k = min(self.top_k, n_available)
        pairs = self.store.similarity_search_with_score(primary_query, k=fetch_k)

        candidates = []
        for doc, distance in pairs:
            meta = doc.metadata or {}
            candidates.append({
                "text"      : doc.page_content,
                "chunk_id"  : meta.get("chunk_id"),
                "page_hint" : meta.get("page_hint"),
                "char_start": meta.get("char_start"),
                "char_end"  : meta.get("char_end"),
                "word_count": meta.get("word_count"),
                # similarity_search_with_score returns DISTANCE, not similarity.
                "score"     : round(1.0 - distance, 4),
            })

        return candidates


# ══════════════════════════════════════════════════════════════════════════════
# Prompt + LLM (LCEL chain)
# ══════════════════════════════════════════════════════════════════════════════

# Ported verbatim from Backend/src/controllers/aiController.js — same rules, same
# order, same wording. Two structural changes only:
#   1. ADDITIONAL FOCUS (user-supplied text) is no longer concatenated into the
#      system message; it arrives as its own human turn via focus_messages.
#   2. template_format="jinja2" — the OUTPUT FORMAT block is literal JSON full of
#      { and }, which LangChain's default f-string templating would try to parse
#      as variables. Jinja2 only reserves {{ }} / {% %} / {# #}, none of which
#      occur in the schema, so it passes through untouched with no escaping.
SYSTEM_PROMPT = """You are a senior tech lead and software architect planning a real product build.

Your job: analyse the CONTEXT below and produce a structured, modular execution plan.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRICT RULES — VIOLATING ANY RULE IS A FAILURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. GROUP tasks into functional MODULES (e.g. Authentication, Backend API, Task Management, UI, DevOps).
2. Every task MUST have a minimum of 3 concrete subtasks — never return an empty array.
3. PRIORITY logic is MANDATORY — not all tasks can be the same priority:
   • "High"   → blocking core features (auth, data layer, critical backend)
   • "Medium" → important but non-blocking (dashboards, UI enhancements)
   • "Low"    → optional or polish features
4. DEPENDENCY logic — use exact task names, not IDs:
   • Authentication tasks come before any protected feature
   • Data/backend layer before dashboards or analytics
   • State management before UI rendering
   • Real-time features depend on backend readiness
5. DO NOT generate deadlines — omit the field entirely.
6. DO NOT use the word "unspecified" anywhere in the output.
7. DO NOT return empty arrays for subtasks or dependencies.
   If a task has no dependencies, use an empty array [].
8. DEDUPLICATE — merge semantically overlapping tasks before output.
9. Assign "assignedTo" using EXACT user IDs from TEAM_CONTEXT below.
   If no team context exists, omit the "assignedTo" field.
10. Output ONLY raw JSON — no explanation, no markdown, no extra text.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VALIDATION — CHECK BEFORE RETURNING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Every task has at least 3 subtasks ✓
• Priorities are distributed across High / Medium / Low ✓
• Dependencies reference valid task names ✓
• No duplicate or semantically overlapping tasks ✓
• No "unspecified" anywhere ✓
• No deadlines ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT (strict JSON only)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "project_name": "name extracted from document",
  "project_summary": "one-paragraph summary of what is being built",
  "modules": [
    {
      "name": "Module Name",
      "module_description": "What this module covers",
      "tasks": [
        {
          "task": "Exact task name",
          "description": "Clear description of what needs to be done",
          "subtasks": [
            "Step 1 — specific actionable step",
            "Step 2 — specific actionable step",
            "Step 3 — specific actionable step"
          ],
          "priority": "High | Medium | Low",
          "dependencies": ["Exact task name this depends on"],
          "estimated_complexity": "Low | Medium | High",
          "suggested_role": "Frontend | Backend | Fullstack | DevOps",
          "assignedTo": "User ID from TEAM_CONTEXT (omit if no team)"
        }
      ]
    }
  ]
}
Return ONLY valid JSON.
No explanation.
No markdown.

{{ team_context }}

CONTEXT (retrieved from {{ total_chunks }} total document chunks via semantic search):
{{ rag_context }}


"""
# NOTE the trailing blank lines: the original Node template ended with
#   ${ragContext}\n\n${query ? "ADDITIONAL FOCUS:\n" + query : ""}\n
# so with the focus text removed the system message still ends in "\n\n\n".
# Kept so the rendered system prompt is byte-identical to the pre-migration one.

PROMPT = ChatPromptTemplate.from_messages(
    [
        ("system", SYSTEM_PROMPT),
        MessagesPlaceholder("focus_messages", optional=True),
    ],
    template_format="jinja2",
)

_LLM = None
_CHAIN = None


def get_chain():
    """Lazily build the LCEL chain so the service still boots (and /health still
    answers) when GROQ_API_KEY is absent."""
    global _LLM, _CHAIN
    if _CHAIN is not None:
        return _CHAIN

    api_key = os.environ.get("GROQ_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set in the RAG service environment")

    _LLM = ChatGroq(
        model_name=GROQ_MODEL,
        temperature=0.2,
        max_tokens=GROQ_MAX_TOKENS,
        request_timeout=GROQ_TIMEOUT_SECONDS,
        max_retries=GROQ_MAX_RETRIES,
        groq_api_key=api_key,
        reasoning_effort="low",     # this installed version of langchain-groq (1.1.3) exposes this as a
                                    # first-class constructor param — passing it inside model_kwargs raises
                                    # a pydantic ValidationError at construction time
        reasoning_format="hidden",  # same as above — required by Groq when JSON mode + reasoning model are
                                    # combined, but must be passed here, not in model_kwargs
        # ChatGroq has no first-class response_format field; it is forwarded to
        # the Groq API through model_kwargs.
        model_kwargs={"response_format": {"type": "json_object"}},
    )

    # Plain LCEL: prompt | llm. NOT RetrievalQA or any canned chain — those
    # inject their own default prompt and would silently override the rules block.
    _CHAIN = PROMPT | _LLM
    log.info("LCEL chain ready ✓ (model=%s, max_tokens=%d)", GROQ_MODEL, GROQ_MAX_TOKENS)
    return _CHAIN


# ══════════════════════════════════════════════════════════════════════════════
# Routes
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/rag", methods=["POST"])
@app.route("/", methods=["POST"])
def rag_endpoint():
    """
    Expects multipart/form-data:
      file              – PDF binary
      query             – retrieval query (optional)
      teamContextString – pre-computed team context from Node (optional)
    """
    if "file" not in request.files:
        return jsonify({"error": "No 'file' field in request"}), 400

    pdf_file  = request.files["file"]
    pdf_bytes = pdf_file.read()
    if not pdf_bytes:
        return jsonify({"error": "Uploaded file is empty"}), 400

    user_query = request.form.get("query") or None
    # Computed in Node (it owns the Mongo queries) and passed through untouched.
    team_context = request.form.get("teamContextString") or \
        "No specific team context provided. Do not invent users."

    try:
        log.info("Extracting text from PDF…")
        pages = extract_text_with_pages(pdf_bytes)
        full_text = "\n\n".join(p["text"] for p in pages)

        if not full_text.strip():
            return jsonify({
                "error": "No extractable text found. The PDF may be image-only or corrupted."
            }), 422

        documents = documents_from_pages(pages)
        log.info("Created %d smart chunks", len(documents))
        if not documents:
            return jsonify({"error": "Chunking produced no output"}), 422

        collection_name = _pdf_hash(pdf_bytes)
        store, db_reused = embed_and_store(documents, collection_name)

        retriever = DynamicKRetriever(store, CHROMA_CLIENT, collection_name, top_k=TOP_K)
        results = retriever.retrieve(user_query)
        log.info("Retrieved %d chunks (db_reused=%s) ✓", len(results), db_reused)

        # Identical to the string Node used to build with chunks.join("\n\n---\n\n")
        rag_context = "\n\n---\n\n".join(r["text"] for r in results)

        focus_messages = []
        if user_query and user_query.strip():
            focus_messages.append(
                HumanMessage(content="ADDITIONAL FOCUS:\n" + user_query.strip())
            )

        log.info("Invoking LCEL chain (model=%s)…", GROQ_MODEL)
        completion = get_chain().invoke({
            "team_context" : team_context,
            "total_chunks" : len(documents),
            "rag_context"  : rag_context,
            "focus_messages": focus_messages,
        })
        raw_response = completion.content
        log.info("LLM returned %d chars ✓", len(raw_response or ""))

        return jsonify({
            "chunks"      : [r["text"]  for r in results],
            "chunk_meta"  : [{k: v for k, v in r.items() if k != "text"} for r in results],
            "text_snippet": full_text[:500] + ("…" if len(full_text) > 500 else ""),
            "total_chunks": len(documents),
            "db_reused"   : db_reused,
            # ── new in Wave 2 ──
            "context"     : rag_context,
            "response"    : raw_response,
        })

    except Exception as exc:
        log.exception("RAG pipeline error: %s", exc)
        return jsonify({"error": str(exc)}), 500


@app.route("/health", methods=["GET"])
def health():
    try:
        collections = CHROMA_CLIENT.list_collections()
        num_collections = len(collections)
    except Exception as e:
        log.error(f"Error in health check: {e}")
        return jsonify({"status": "error", "error": str(e)}), 500

    degraded = CHROMA_MODE != CHROMA_MODE_PERSISTENT

    body = {
        # "degraded" means the service still answers queries but is running on
        # the non-persistent fallback client — see init_chroma().
        "status"      : "degraded" if degraded else "ok",
        "storage_mode": CHROMA_MODE,
        "model"       : EMBED_MODEL_NAME,
    }

    # Detail is only returned to authenticated callers; the open keep-alive ping
    # gets status alone. (When no secret is configured this stays fully open,
    # exactly as before.)
    if _request_is_authenticated() or not RAG_SHARED_SECRET:
        body["top_k"]       = TOP_K
        body["db_path"]     = CHROMA_DB_PATH
        body["collections"] = num_collections
        body["llm_model"]   = GROQ_MODEL
        body["llm_ready"]   = bool(os.environ.get("GROQ_API_KEY", "").strip())
        if degraded:
            body["degraded_reason"] = CHROMA_INIT_ERROR

    # HTTP 200 even when degraded: the service is serving, and the keep-alive
    # monitor should not page for a condition that is expected on restart.
    return jsonify(body)


@app.route("/cache", methods=["DELETE"])
def clear_cache():
    """Delete all stored PDF collections (force re-embed on next upload)."""
    deleted = 0
    for col in CHROMA_CLIENT.list_collections():
        if col.name.startswith("pdf_"):
            CHROMA_CLIENT.delete_collection(col.name)
            deleted += 1
    log.info("Cleared %d cached PDF collections", deleted)
    return jsonify({"deleted": deleted})


# ── Entry point ───────────────────────────────────────────────────────────────

# Production (Docker/Render) serves this module through gunicorn — see the
# Dockerfile CMD. The block below is for local development only; running
# app.run() in production would put the Werkzeug dev server on the request path.
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    log.info("Starting RAG service (DEV server) on port %d (TOP_K=%d, CPU-ONLY)", port, TOP_K)
    log.info("Production entrypoint is: gunicorn --bind 0.0.0.0:$PORT app:app")
    app.run(host="0.0.0.0", port=port, debug=False)
