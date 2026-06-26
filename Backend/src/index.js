import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/databaseConnection.js";
import { logger } from "./utils/logger.js";
import { startProjectScheduler } from "./services/projectSchedulerService.js";
import http from "http";
import { initSocket } from "./utils/socket.js";

dotenv.config({
    path: "./.env",
});

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
