import Pusher from "pusher";
import { getIO } from "./socket.js";

// ── Dual-Mode Real-Time Transport ─────────────────────────────────────────────
//
// PRODUCTION (Vercel):   Uses Pusher Channels — plain HTTP API calls, works
//                        perfectly with serverless functions.
//
// LOCAL DEV / RENDER:    Uses the Socket.io instance initialized in index.js.
//                        Zero extra setup needed for local dev.
//
// Selection is automatic: if PUSHER_* env vars are present → Pusher.
//                          Otherwise → Socket.io fallback.
//
// Required env vars for Pusher:
//   PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER
// Get them from https://pusher.com → Create App → App Keys

const PUSHER_CONFIGURED =
    process.env.PUSHER_APP_ID &&
    process.env.PUSHER_KEY &&
    process.env.PUSHER_SECRET &&
    process.env.PUSHER_CLUSTER;

let pusherClient = null;

if (PUSHER_CONFIGURED) {
    pusherClient = new Pusher({
        appId:   process.env.PUSHER_APP_ID,
        key:     process.env.PUSHER_KEY,
        secret:  process.env.PUSHER_SECRET,
        cluster: process.env.PUSHER_CLUSTER,
        useTLS:  true,
    });
    console.log("[Realtime] Transport: Pusher Channels ✓");
} else {
    console.log(
        "[Realtime] PUSHER_* env vars not set — falling back to Socket.io. " +
        "This is expected for local dev. Add PUSHER_* vars to use Pusher on Vercel."
    );
}

/**
 * Emit a real-time event to all clients watching a project.
 *
 * Automatically uses Pusher (production) or Socket.io (local dev).
 * Drop-in replacement for the old socket.js emitToProject — same signature.
 *
 * @param {string} projectId         - MongoDB project ID
 * @param {string} event             - Event name (e.g. "workflow-updated")
 * @param {Object} data              - Payload
 * @param {string} [excludeSocketId] - Socket/Pusher ID of the sender tab to exclude
 */
export const emitToProject = async (projectId, event, data, excludeSocketId) => {
    // ── Pusher path (production / Vercel) ─────────────────────────────────────
    if (pusherClient) {
        const channel = `project-${projectId}`;
        console.log(
            `[Pusher] Emitting "${event}" → channel "${channel}"` +
            (excludeSocketId ? ` (excluding socket ${excludeSocketId})` : "")
        );
        try {
            await pusherClient.trigger(channel, event, data,
                excludeSocketId ? { socket_id: excludeSocketId } : {}
            );
        } catch (err) {
            // Non-fatal — a failed Pusher emit should never break the REST response
            console.error("[Pusher] Failed to emit event:", err.message);
        }
        return;
    }

    // ── Socket.io fallback (local dev / Render) ───────────────────────────────
    const io = getIO();
    if (!io) {
        // Socket.io not initialized (e.g. VERCEL=1 set but no Pusher configured)
        console.warn("[Realtime] No transport available — skipping emit.");
        return;
    }
    const room = `project:${projectId}`;
    const socketsInRoom = io.sockets.adapter.rooms.get(room);
    const count = socketsInRoom ? socketsInRoom.size : 0;
    console.log(`[Socket.io] Emitting "${event}" → room "${room}" (${count} socket(s), exclude: ${excludeSocketId || "none"})`);

    if (excludeSocketId) {
        io.to(room).except(excludeSocketId).emit(event, data);
    } else {
        io.to(room).emit(event, data);
    }
};
