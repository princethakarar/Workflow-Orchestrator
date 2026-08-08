/**
 * Single source of truth for reaching the Python RAG microservice.
 *
 * RAG_SERVICE_URL is accepted either as the bare origin
 * ("https://rag-service.onrender.com") or with the endpoint already appended
 * ("https://rag-service.onrender.com/rag"). Both forms are normalised here so
 * callers never have to guess — previously aiController.js and index.js each
 * did their own normalisation and disagreed, which is how the warm-up ping
 * ended up pointing at "/rag/health".
 *
 * Getters are lazy (not module-level constants) because ESM hoists imports
 * above index.js's dotenv.config() call — the same reason githubService.js
 * reads its env vars at call time.
 */

const DEFAULT_RAG_URL = "http://127.0.0.1:5001/rag"

/** Strip trailing slashes and a trailing /rag to get the service origin. */
const normalizeBase = (raw) => raw.replace(/\/+$/, "").replace(/\/rag$/, "")

export const getRagBaseUrl = () => normalizeBase(process.env.RAG_SERVICE_URL || DEFAULT_RAG_URL)

/** POST endpoint: PDF in, retrieved chunks out. */
export const getRagEndpoint = () => `${getRagBaseUrl()}/rag`

/** GET endpoint: liveness + storage-mode reporting. */
export const getRagHealthUrl = () => `${getRagBaseUrl()}/health`

/**
 * Shared-secret header expected by the RAG service's before_request hook.
 * Returns {} when unset so local development keeps working; the RAG service
 * stays open until it has the same secret configured.
 */
export const getRagAuthHeaders = () => {
    const secret = process.env.RAG_SHARED_SECRET
    return secret ? { "X-RAG-Secret": secret } : {}
}

/**
 * Cold-start budget for a full pipeline call. A sleeping Render free instance
 * must wake, import torch/transformers/chromadb and load MiniLM before it can
 * answer, so this is deliberately much larger than the health-ping budget.
 * Kept in sync with gunicorn's --timeout in rag_service/Dockerfile.
 */
export const RAG_REQUEST_TIMEOUT_MS = 120_000

/** Health pings must stay cheap — the service either answers or it is asleep. */
export const RAG_HEALTH_TIMEOUT_MS = 30_000
