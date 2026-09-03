import cron from "node-cron";
import { logger } from "../utils/logger.js";
import { getRagHealthUrl, getRagAuthHeaders } from "../config/ragConfig.js";

/**
 * Keep-alive pinger for Render free-tier services.
 *
 * Render spins down free-tier web services after ~15 minutes of inactivity.
 * This cron pings both service health endpoints every 14 minutes so they
 * stay warm and avoid cold-start delays on real requests.
 *
 * Why inside the process instead of an external cron?
 *   – External cron jobs (cron-job.org, GitHub Actions schedules, etc.) are
 *     reliable for waking ONE service, but if that service is itself sleeping
 *     the ping fires while it's cold, gets a timeout, and logs a failure.
 *   – Running the pinger inside the backend means it wakes with the backend
 *     and immediately starts keeping both services alive.
 *
 * Timeout budget:
 *   A Render free instance cold-start can take 30–60 s. Each ping is given
 *   90 s (KEEP_ALIVE_TIMEOUT_MS) — enough to outlast a boot without blocking
 *   the cron slot for long on a healthy service.
 */

const KEEP_ALIVE_TIMEOUT_MS = 90_000; // 90 s — matches RAG_HEALTH_TIMEOUT_MS

/**
 * The backend's own public health URL.
 * Falls back to localhost so local dev doesn't fire external requests.
 */
const getBackendHealthUrl = () => {
    const base = process.env.BACKEND_PUBLIC_URL || "http://localhost:8000";
    return `${base.replace(/\/+$/, "")}/health`;
};

/**
 * Ping a single URL and log the outcome.
 * Never throws — failures are logged as warnings so the scheduler keeps running.
 */
const pingUrl = async (label, url, headers = {}) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), KEEP_ALIVE_TIMEOUT_MS);

    try {
        const res = await fetch(url, {
            method: "GET",
            headers,
            signal: controller.signal,
        });

        if (res.ok) {
            logger.info(`[KeepAlive] ${label} is awake — HTTP ${res.status}`);
        } else {
            logger.warn(`[KeepAlive] ${label} responded with HTTP ${res.status} from ${url}`);
        }
    } catch (err) {
        if (err.name === "AbortError") {
            logger.warn(
                `[KeepAlive] ${label} ping timed out after ${KEEP_ALIVE_TIMEOUT_MS / 1000}s (${url}) — ` +
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
 * Ping both services concurrently so one slow boot doesn't delay the other.
 */
const pingAll = async () => {
    const backendUrl = getBackendHealthUrl();
    const ragUrl = getRagHealthUrl();
    const ragHeaders = getRagAuthHeaders();

    logger.info(`[KeepAlive] Pinging backend (${backendUrl}) and RAG (${ragUrl})…`);

    await Promise.allSettled([
        pingUrl("Backend", backendUrl),
        pingUrl("RAG", ragUrl, ragHeaders),
    ]);
};

/**
 * Start the keep-alive scheduler.
 * Call this once from index.js after the server starts listening.
 *
 * Schedule: every 14 minutes — safely inside Render's 15-minute spin-down window.
 */
export const startKeepAliveScheduler = () => {
    // Only run in production to avoid unnecessary noise in local dev.
    if (process.env.NODE_ENV !== "production") {
        logger.info("[KeepAlive] Skipping keep-alive scheduler (NODE_ENV is not production)");
        return;
    }

    // Run immediately on startup to warm the RAG service right away,
    // then every 14 minutes thereafter.
    pingAll();

    cron.schedule("*/14 * * * *", async () => {
        await pingAll();
    });

    logger.info(
        "[KeepAlive] Keep-alive scheduler started — pinging backend + RAG every 14 minutes"
    );
};
