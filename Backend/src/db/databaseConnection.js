import mongoose from "mongoose"
import { logger } from "../utils/logger.js"

// ── Serverless-safe cached connection ─────────────────────────────────────────
// Vercel spins up a new module context per cold-start but reuses the same Node
// process (and therefore the same global object) for subsequent warm invocations.
// Storing the connection state on `globalThis` means mongoose.connect() is only
// called once per process lifetime, not once per request.
//
// Options chosen for serverless:
//   bufferCommands: false  – fail fast instead of queuing ops while disconnected
//   serverSelectionTimeoutMS: 5000 – surface Atlas/network issues within 5 s
//
// If you are NOT on Vercel (local dev, Render, Docker) this module behaves
// identically to a plain mongoose.connect() call; the cache just avoids
// redundant connection attempts between hot-module-reloads.
// ──────────────────────────────────────────────────────────────────────────────

// Attach cache to globalThis so it survives HMR / multiple module evaluations.
/** @type {{ conn: typeof mongoose | null, promise: Promise<typeof mongoose> | null }} */
const cached = globalThis.__mongoose_cache__ ?? { conn: null, promise: null }
globalThis.__mongoose_cache__ = cached

const connectDB = async () => {
    // Return the already-established connection immediately.
    if (cached.conn) {
        return cached.conn
    }

    // Reuse an in-flight connection attempt (e.g. two requests arriving
    // simultaneously during a cold-start).
    if (!cached.promise) {
        cached.promise = mongoose
            .connect(process.env.MONGO_URI, {
                bufferCommands: false,
                serverSelectionTimeoutMS: 5000,
            })
            .then((mongooseInstance) => {
                logger.info("MongoDB connected successfully")
                return mongooseInstance
            })
            .catch((err) => {
                // Reset so the next request gets a fresh attempt.
                cached.promise = null
                console.error("[connectDB] Connection failed:", err)
                throw err
            })
    }

    cached.conn = await cached.promise
    return cached.conn
}

export default connectDB

// --- DevPilot preview note ---
// If `npm run dev` hangs at "connectDB() has not resolved" inside DevPilot's
// browser preview, that's expected: WebContainer cannot open raw TCP sockets,
// so any MongoDB driver will fail there. Run the Frontend only in preview;
// it is configured to call the deployed backend instead of localhost:8000.
