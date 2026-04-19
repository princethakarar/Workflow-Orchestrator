from flask import Flask, request, jsonify
from flask_cors import CORS
import fitz          # PyMuPDF
import chromadb
from sentence_transformers import SentenceTransformer, CrossEncoder
import hashlib
import re
import logging
import os

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ── App ───────────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

# ── Embedding & Reranking Models ──────────────────────────────────────────────
log.info("Loading sentence-transformers model (all-MiniLM-L6-v2)…")
EMBED_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
log.info("Loading cross-encoder reranker (ms-marco-MiniLM-L-6-v2)…")
RERANK_MODEL = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
log.info("Models ready ✓")

# ── Upgrade 1: Persistent ChromaDB client ────────────────────────────────────
CHROMA_DB_PATH = os.path.join(os.path.dirname(__file__), "chroma_db")
os.makedirs(CHROMA_DB_PATH, exist_ok=True)

def init_chroma():
    """Initialize ChromaDB client with fallback for common corruption issues."""
    try:
        client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
        # Verify it works
        client.list_collections()
        return client
    except Exception as e:
        log.error(f"ChromaDB initialization failed: {e}")
        if "table collections already exists" in str(e) or "database disk image is malformed" in str(e):
            log.warning("ChromaDB persistent storage corrupted. Falling back to in-memory mode.")
            log.info("TIP: To fix permanently, delete the 'Backend/rag_service/chroma_db' directory.")
        return chromadb.Client() # In-memory fallback

CHROMA_CLIENT = init_chroma()
log.info("ChromaDB client initialized ✓")

# ── Upgrade 5: Tuning constants ───────────────────────────────────────────────
TOP_K          = 10     
RERANK_POOL    = 30     # candidates to fetch before reranking
MIN_CHUNK_CHARS = 300   
MAX_CHUNK_CHARS = 1800  
OVERLAP_WORDS   = 40    


# ══════════════════════════════════════════════════════════════════════════════
# Upgrade 2: Better chunking — paragraph + sentence boundary aware
# ══════════════════════════════════════════════════════════════════════════════

def _split_sentences(text: str) -> list[str]:
    """Naïve but fast sentence splitter (avoids heavy NLTK dependency)."""
    # Split on . ! ? followed by whitespace + capital letter or end-of-string
    parts = re.split(r'(?<=[.!?])\s+(?=[A-Z\d"\'])', text)
    return [p.strip() for p in parts if p.strip()]


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


def chunk_text_smart(
    pages: list[dict],
    min_chars: int = MIN_CHUNK_CHARS,
    max_chars: int = MAX_CHUNK_CHARS,
    overlap_words: int = OVERLAP_WORDS,
) -> list[dict]:
    """
    Paragraph-aware, sentence-boundary chunking.

    Algorithm:
      1. Iterate page blocks (natural paragraph boundaries).
      2. If a block is small, merge with the next until ≥ min_chars.
      3. If a block is large, split on sentence boundaries.
      4. Prepend the last `overlap_words` words of the previous chunk
         to the current chunk so context is not lost at boundaries.

    Returns a list of dicts:
      {
        "text"      : str,
        "chunk_id"  : int,
        "page_hint" : int,   # page number of the first byte of this chunk
        "char_start": int,   # approximate char offset in the full document
        "char_end"  : int,
        "word_count": int,
      }
    """
    # ── Collect raw paragraph blocks with page provenance ─────────────────────
    raw_blocks: list[dict] = []
    char_cursor = 0
    for page_info in pages:
        page_num = page_info["page"]
        for para in re.split(r"\n{2,}", page_info["text"]):
            para = para.strip()
            if not para:
                continue
            raw_blocks.append({
                "page": page_num,
                "text": para,
                "char_start": char_cursor,
            })
            char_cursor += len(para) + 2  # +2 for the double newline separator

    # ── Merge tiny blocks and split giant blocks on sentence boundaries ────────
    merged: list[dict] = []
    buf_text  = ""
    buf_page  = 1
    buf_start = 0

    def flush(text, page, start):
        if text.strip():
            merged.append({
                "page": page,
                "text": text.strip(),
                "char_start": start,
                "char_end": start + len(text),
            })

    for block in raw_blocks:
        text  = block["text"]
        page  = block["page"]
        start = block["char_start"]

        if not buf_text:
            buf_text  = text
            buf_page  = page
            buf_start = start
        elif len(buf_text) + len(text) < max_chars:
            buf_text  += "\n\n" + text   # merge small blocks
        else:
            # Current buffer is big enough — flush it
            flush(buf_text, buf_page, buf_start)
            # Start new buffer with incoming block
            buf_text  = text
            buf_page  = page
            buf_start = start

        # If accumulated buffer is too large, sentence-split and flush
        while len(buf_text) > max_chars:
            sentences = _split_sentences(buf_text)
            split_point = ""
            remainder   = buf_text
            for i, sent in enumerate(sentences):
                if len(split_point) + len(sent) >= max_chars and split_point:
                    flush(split_point.strip(), buf_page, buf_start)
                    buf_start += len(split_point)
                    remainder  = " ".join(sentences[i:])
                    split_point = ""
                else:
                    split_point += (" " if split_point else "") + sent
            buf_text = remainder if remainder != buf_text else split_point
            if buf_text == remainder:
                break  # prevent infinite loop on unsplittable text

    flush(buf_text, buf_page, buf_start)

    # ── Discard micro-fragments ───────────────────────────────────────────────
    merged = [b for b in merged if len(b["text"]) >= min_chars]

    # ── Add overlap between adjacent chunks ───────────────────────────────────
    final_chunks: list[dict] = []
    for i, block in enumerate(merged):
        text = block["text"]
        if i > 0:
            prev_words = final_chunks[-1]["text"].split()
            overlap    = " ".join(prev_words[-overlap_words:])
            if overlap and not text.startswith(overlap[:30]):
                text = overlap + " … " + text

        final_chunks.append({
            "chunk_id"  : i,
            "page_hint" : block["page"],
            "char_start": block["char_start"],
            "char_end"  : block["char_end"],
            "word_count": len(text.split()),
            "text"      : text,
        })

    return final_chunks


# ══════════════════════════════════════════════════════════════════════════════
# ChromaDB: embed + store (with persistence & cache check)
# ══════════════════════════════════════════════════════════════════════════════

def _pdf_hash(pdf_bytes: bytes) -> str:
    """SHA-256 fingerprint of the PDF bytes — used as the collection name."""
    return "pdf_" + hashlib.sha256(pdf_bytes).hexdigest()[:32]


def embed_and_store(chunks: list[dict], collection_name: str) -> tuple[chromadb.Collection, bool]:
    """
    Embed chunk texts and store in the ChromaDB collection.
    Uses get_or_create_collection for atomicity.
    """
    # Check if it exists first to report db_reused correctly
    existing_names = [c.name for c in CHROMA_CLIENT.list_collections()]
    db_reused = collection_name in existing_names

    collection = CHROMA_CLIENT.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )

    if db_reused:
        log.info("Cache hit — reusing existing collection '%s'", collection_name)
        return collection, True

    texts      = [c["text"]     for c in chunks]
    ids        = [str(c["chunk_id"]) for c in chunks]
    metadatas  = [{k: v for k, v in c.items() if k != "text"} for c in chunks]

    log.info("Embedding %d chunks…", len(texts))
    embeddings = EMBED_MODEL.encode(texts, show_progress_bar=False).tolist()

    collection.add(
        documents=texts,
        embeddings=embeddings,
        ids=ids,
        metadatas=metadatas,
    )
    log.info("Stored %d chunks in ChromaDB ✓", len(texts))
    return collection, False


# ══════════════════════════════════════════════════════════════════════════════
# Upgrade 3: Better / multi-angle query
# ══════════════════════════════════════════════════════════════════════════════

DEFAULT_QUERIES = [
    "project modules tasks features requirements",
    "task priority High Medium Low blocking dependencies",
    "system architecture backend frontend API database",
    "user stories acceptance criteria functional requirements",
]


def retrieve(
    collection: chromadb.Collection,
    user_query: str | None,
    k: int = TOP_K,
) -> list[dict]:
    """
    Multi-angle retrieval + Reranking:
    1. Issue several complementary queries.
    2. Collect a larger pool of candidates (RERANK_POOL).
    3. Use CrossEncoder to rerank candidates against the user query.
    4. Return top-k.
    """
    queries = list(DEFAULT_QUERIES)
    primary_query = user_query.strip() if (user_query and user_query.strip()) else DEFAULT_QUERIES[0]
    
    if user_query and user_query.strip():
        queries.insert(0, primary_query)

    seen_ids: set[str] = set()
    candidates: list[dict] = []

    n_available = collection.count()
    # Fetch more than k to have a good pool for reranking
    fetch_k = min(RERANK_POOL, n_available)

    for q in queries:
        emb = EMBED_MODEL.encode([q], show_progress_bar=False).tolist()
        res = collection.query(
            query_embeddings=emb,
            n_results=fetch_k,
            include=["documents", "metadatas", "distances"],
        )
        docs      = res["documents"][0]
        metas     = res["metadatas"][0]
        distances = res["distances"][0]

        for doc, meta, dist in zip(docs, metas, distances):
            cid = str(meta.get("chunk_id", ""))
            if cid not in seen_ids:
                seen_ids.add(cid)
                candidates.append({
                    "text"      : doc,
                    "chunk_id"  : meta.get("chunk_id"),
                    "page_hint" : meta.get("page_hint"),
                    "char_start": meta.get("char_start"),
                    "char_end"  : meta.get("char_end"),
                    "word_count": meta.get("word_count"),
                    "initial_score": round(1.0 - dist, 4),
                })

    if not candidates:
        return []

    # ── Upgrade: Reranking ────────────────────────────────────────────────────
    log.info("Reranking %d candidates against: %r", len(candidates), primary_query[:50])
    
    # Prepare pairs for cross-encoder: (query, document)
    pairs = [[primary_query, c["text"]] for c in candidates]
    rerank_scores = RERANK_MODEL.predict(pairs)

    for i, score in enumerate(rerank_scores):
        candidates[i]["rerank_score"] = float(score)

    # Sort by rerank score descending
    candidates.sort(key=lambda x: x["rerank_score"], reverse=True)
    
    return candidates[:k]


# ══════════════════════════════════════════════════════════════════════════════
# Route
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/rag", methods=["POST"])
def rag_endpoint():
    """
    Expects multipart/form-data:
      file  – PDF binary
      query – retrieval query (optional)
    """
    if "file" not in request.files:
        return jsonify({"error": "No 'file' field in request"}), 400

    pdf_file  = request.files["file"]
    pdf_bytes = pdf_file.read()
    if not pdf_bytes:
        return jsonify({"error": "Uploaded file is empty"}), 400

    user_query = request.form.get("query") or None

    try:
        # 1 ▸ Extract text page-by-page (preserves paragraph blocks)
        log.info("Extracting text from PDF…")
        pages = extract_text_with_pages(pdf_bytes)
        full_text = "\n\n".join(p["text"] for p in pages)

        if not full_text.strip():
            return jsonify({
                "error": "No extractable text found. The PDF may be image-only or corrupted."
            }), 422

        # 2 ▸ Smart chunking
        chunks = chunk_text_smart(pages)
        log.info("Created %d smart chunks", len(chunks))
        if not chunks:
            return jsonify({"error": "Chunking produced no output"}), 422

        # 3 ▸ Embed + store (persistent, hash-keyed)
        collection_name = _pdf_hash(pdf_bytes)
        collection, db_reused = embed_and_store(chunks, collection_name)

        # 4 ▸ Multi-angle retrieval → returns list[dict] with metadata
        results = retrieve(collection, user_query, k=TOP_K)
        log.info("Retrieved %d chunks (db_reused=%s) ✓", len(results), db_reused)

        return jsonify({
            "chunks"      : [r["text"]  for r in results],   # backward compat
            "chunk_meta"  : [{k: v for k, v in r.items() if k != "text"} for r in results],
            "text_snippet": full_text[:500] + ("…" if len(full_text) > 500 else ""),
            "total_chunks": len(chunks),
            "db_reused"   : db_reused,
        })

    except Exception as exc:
        log.exception("RAG pipeline error: %s", exc)
        return jsonify({"error": str(exc)}), 500


@app.route("/health", methods=["GET"])
def health():
    collections = [c.name for c in CHROMA_CLIENT.list_collections()]
    return jsonify({
        "status"      : "ok",
        "model"       : "all-MiniLM-L6-v2",
        "top_k"       : TOP_K,
        "db_path"     : CHROMA_DB_PATH,
        "collections" : len(collections),
    })


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

if __name__ == "__main__":
    log.info("Starting RAG service on http://localhost:5001  (TOP_K=%d, RERANK=ON)", TOP_K)
    app.run(host="0.0.0.0", port=5001, debug=False)
