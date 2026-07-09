import "./loadEnv.js";
import app from "./app.js";
import connectDB from "./db/databaseConnection.js";
import { logger } from "./utils/logger.js";
import { startProjectScheduler } from "./services/projectSchedulerService.js";
import http from "http";
import { initSocket } from "./utils/socket.js";

const port = process.env.PORT || 3000;
const server = http.createServer(app);
initSocket(server);

const warmUpRAG = async () => {
    try {
        const ragUrl = process.env.RAG_SERVICE_URL || 'http://127.0.0.1:5001/rag';
        const fetch = (await import('node-fetch')).default || global.fetch; // Use global fetch in Node 18+
        await fetch(`${ragUrl}/health`, { signal: AbortSignal.timeout(30000) });
        logger.info('[Startup] RAG microservice is awake');
    } catch (err) {
        logger.warn(`[Startup] RAG warm-up ping failed: ${err.message}`);
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
