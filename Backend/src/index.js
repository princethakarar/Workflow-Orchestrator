import dotenv from "dotenv";
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

dotenv.config({
    path: "./.env",
});

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

connectDB()
    .then(() => {
        startProjectScheduler();
        server.listen(port, () => {
            logger.info(`Server running on port ${port}`);
            warmUpRAG();
        });
    })
    .catch((err) => {
        logger.error(`MongoDB connection error: ${err.message}`);
        process.exit(1);
    });
