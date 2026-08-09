import "./loadEnv.js";
import app from "./app.js";
import connectDB from "./db/databaseConnection.js";
import { logger } from "./utils/logger.js";
import { startProjectScheduler } from "./services/projectSchedulerService.js";
import http from "http";
import { initSocket } from "./utils/socket.js";
import {
    getRagHealthUrl,
    getRagAuthHeaders,
    RAG_HEALTH_TIMEOUT_MS,
} from "./config/ragConfig.js";

const port = process.env.PORT || 3000;
const server = http.createServer(app);
initSocket(server);

const warmUpRAG = async () => {
    const healthUrl = getRagHealthUrl();
    try {
        // Node 20 has a global fetch; the previous dynamic import of "node-fetch"
        // threw ERR_MODULE_NOT_FOUND (it is not a dependency), so this ping never
        // actually left the process.
        const res = await fetch(healthUrl, {
            headers: getRagAuthHeaders(),
            signal: AbortSignal.timeout(RAG_HEALTH_TIMEOUT_MS),
        });

        if (!res.ok) {
            logger.warn(`[Startup] RAG warm-up ping got HTTP ${res.status} from ${healthUrl}`);
            return;
        }

        const body = await res.json().catch(() => ({}));
        if (body.status === 'degraded') {
            logger.warn(
                `[Startup] RAG microservice is awake but DEGRADED (storage_mode=${body.storage_mode}) — ` +
                'embeddings are not being persisted'
            );
        } else {
            logger.info('[Startup] RAG microservice is awake');
        }
    } catch (err) {
        logger.warn(`[Startup] RAG warm-up ping to ${healthUrl} failed: ${err.message}`);
    }
};

// Diagnostic-only: connectDB() should settle (resolve or reject) quickly. If
// it's still pending after this window with nothing logged either way, the
// most likely cause is that the environment can't open the raw TCP socket
// mongoose needs — browsers have no raw TCP socket API at all, so if this is
// running inside a browser-based preview (not a real deployed server), a
// mongodb:// connection cannot succeed there regardless of MONGO_URI being
// correct. A hung (never-settling) promise like that has no live handle
// backing it, so Node's event loop simply runs out of work and the process
// exits with code 0 once nothing else is pending — no crash, no error log.
const CONNECT_DIAGNOSTIC_TIMEOUT_MS = 10_000;
const connectDiagnosticTimeout = setTimeout(() => {
    console.warn(
        `[Startup] connectDB() has not resolved or rejected after ${CONNECT_DIAGNOSTIC_TIMEOUT_MS}ms. ` +
        "If nothing else logs after this and the process later exits cleanly with no error, " +
        "the raw MongoDB TCP connection likely cannot be established from this environment."
    );
}, CONNECT_DIAGNOSTIC_TIMEOUT_MS);

console.log("[Startup] Attempting to connect to MongoDB...");
connectDB()
    .then(() => {
        clearTimeout(connectDiagnosticTimeout);
        console.log("[Startup] connectDB() resolved successfully.");
        startProjectScheduler();
        console.log(`[Startup] Attempting to start server on port ${port}...`);
        server.listen(port, () => {
            console.log(`[Startup] Server listening on port ${port}`);
            logger.info(`Server running on port ${port}`);
            warmUpRAG();
        });
    })
    .catch((err) => {
        clearTimeout(connectDiagnosticTimeout);
        console.error(`[Startup] connectDB() rejected: ${err.message}`);
        logger.error(`MongoDB connection error: ${err.message}`);
        process.exit(1);
    });
