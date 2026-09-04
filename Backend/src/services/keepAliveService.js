import cron from "node-cron";
import { logger } from "../utils/logger.js";
import { getRagHealthUrl, getRagAuthHeaders } from "../config/ragConfig.js";

/**
 * Keep-alive pinger for Render free-tier services.
 *
 * -- The problem with self-pinging via public URL --
 * The backend cannot keep itself alive by pinging its own public URL because
 * when Render spins the process down the cron job dies with it -- nothing fires
 * the next ping and the service stays asleep indefinitely.
 *
 * -- Solution: mutual cross-service pinging --
 * * This service pings the RAG service (a separate Render process) every 14 min.
 * * The RAG service (rag_service/app.py) pings this backend every 14 min.
 * Because they run on independent instances, if one sleeps the other is still
 * alive and its next ping wakes the sleeping one via Render's load balancer.
 *
 * -- Self-ping via localhost --
 * This process also pings itself on localhost. A localhost hit goes directly to
 * the Express server without leaving the machine -- it keeps the Node.js event
 * loop active and generates an access-log entry, both of which signal to Render
 * that this worker is still handling requests.
 *
 * -- Timeout budget --
 * External pings get 90 s -- enough to outlast a Render cold-start (30-60 s).
 * The localhost self-ping gets 10 s -- it must answer instantly.
 */

const KEEP_ALIVE_TIMEOUT_MS = 90_000; // external services -- cold-start budget
const SELF_PING_TIMEOUT_MS  = 10_000; // localhost self-ping -- must be instant

const getSelfHealthUrl = () => {
    const port = process.env.PORT || 8000;
    return `http://localhost:${port}/health`;
};

/**
 * Ping a single URL and log the outcome.
 * Never throws -- failures are logged as warnings so the scheduler keeps running.
 */
const pingUrl = async (label, url, { headers = {}, timeoutMs = KEEP_ALIVE_TIMEOUT_MS } = {}) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(url, {
            method: "GET",
            headers,
            signal: controller.signal,
        });

        if (res.ok) {
            logger.info(`[KeepAlive] ${label} is awake -- HTTP ${res.status}`);
        } else {
            logger.warn(`[KeepAlive] ${label} responded with HTTP ${res.status} from ${url}`);
        }
    } catch (err) {
        if (err.name === "AbortError") {
            logger.warn(
                `[KeepAlive] ${label} ping timed out after ${timeoutMs / 1000}s (${url}) -- ` +
                "service may still be waking up"
            );
        } else {
            logger.warn(`[KeepAlive] ${label} ping failed: ${err.message} (${url})`);
        }
    } finally {
        clearTimeout(timer);
    }
};

/**
 * Ping self (localhost) + RAG service (public URL) concurrently.
 *
 * Self-ping keeps our own event loop active.
 * RAG ping keeps the separate Render instance from spinning down.
 * The RAG service background thread pings us back (see rag_service/app.py).
 */
const pingAll = async () => {
    const selfUrl    = getSelfHealthUrl();
    const ragUrl     = getRagHealthUrl();
    const ragHeaders = getRagAuthHeaders();

    logger.info(`[KeepAlive] Pinging self (${selfUrl}) and RAG (${ragUrl})...`);

    await Promise.allSettled([
        pingUrl("Self", selfUrl, { timeoutMs: SELF_PING_TIMEOUT_MS }),
        pingUrl("RAG",  ragUrl,  { headers: ragHeaders }),
    ]);
};

/**
 * Start the keep-alive scheduler.
 * Called from index.js after the server starts listening.
 *
 * Schedule: every 14 minutes -- safely inside Render's 15-minute spin-down window.
 */
export const startKeepAliveScheduler = () => {
    if (process.env.NODE_ENV !== "production") {
        logger.info("[KeepAlive] Skipping keep-alive scheduler (NODE_ENV is not production)");
        return;
    }

    // Fire immediately on startup to warm the RAG service right away,
    // then every 14 minutes thereafter.
    pingAll();

    cron.schedule("*/14 * * * *", async () => {
        await pingAll();
    });

    logger.info(
        "[KeepAlive] Keep-alive scheduler started -- localhost self-ping + RAG ping every 14 minutes"
    );
};
