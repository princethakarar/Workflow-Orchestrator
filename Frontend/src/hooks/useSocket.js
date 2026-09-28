import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';

// ── Dual-Mode Real-Time Transport ─────────────────────────────────────────────
//
// PRODUCTION (Vercel):  Uses Pusher Channels.
//                       Requires VITE_PUSHER_KEY + VITE_PUSHER_CLUSTER in env.
//
// LOCAL DEV / Render:   Falls back to Socket.io.
//                       Requires VITE_API_BASE_URL (already set for local dev).
//
// Detection is automatic based on whether VITE_PUSHER_KEY is set.

const PUSHER_KEY     = import.meta.env.VITE_PUSHER_KEY;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || 'ap2';
const SOCKET_URL     = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const USE_PUSHER = Boolean(PUSHER_KEY);

// Lazy-load the appropriate library only when needed — avoids loading both
// bundles in every deployment.
let PusherLib   = null;
let SocketIOLib = null;

if (USE_PUSHER) {
    // Dynamic import so socket.io-client is NOT bundled when using Pusher
    import('pusher-js').then(m => { PusherLib = m.default });
} else {
    import('socket.io-client').then(m => { SocketIOLib = m.io });
}

/**
 * useSocket — dual-mode real-time hook.
 *
 * Exposes { on, off, isConnected, socketRef } regardless of transport.
 * socketRef.current.id is the socket/pusher id used by the backend to
 * exclude the sender tab from receiving its own broadcast.
 */
export const useSocket = (projectId) => {
    const { user } = useAuth();

    // Transport-agnostic refs
    const connectionRef = useRef(null);   // Pusher instance OR Socket.io socket
    const channelRef    = useRef(null);   // Pusher channel (null for Socket.io)
    const socketRef     = useRef(null);   // { id: <socket_id | pusher_socket_id> }

    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!projectId || !user) return;

        let cleanupFn = () => {};

        if (USE_PUSHER) {
            // ── Pusher path ────────────────────────────────────────────────────
            import('pusher-js').then(({ default: Pusher }) => {
                console.log('[Pusher] Connecting for project', projectId);

                const pusher  = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER });
                const channel = pusher.subscribe(`project-${projectId}`);

                connectionRef.current = pusher;
                channelRef.current    = channel;

                pusher.connection.bind('connected', () => {
                    const sid = pusher.connection.socket_id;
                    console.log('[Pusher] Connected, socket_id:', sid);
                    socketRef.current = { id: sid };
                    setIsConnected(true);
                });

                pusher.connection.bind('disconnected', () => {
                    console.log('[Pusher] Disconnected');
                    socketRef.current = null;
                    setIsConnected(false);
                });

                pusher.connection.bind('error', (err) => {
                    console.error('[Pusher] Connection error:', err);
                });
            });

            cleanupFn = () => {
                const pusher = connectionRef.current;
                if (pusher) {
                    pusher.unsubscribe(`project-${projectId}`);
                    pusher.disconnect();
                }
                connectionRef.current = null;
                channelRef.current    = null;
                socketRef.current     = null;
                setIsConnected(false);
            };
        } else {
            // ── Socket.io path (local dev / Render) ────────────────────────────
            import('socket.io-client').then(({ io }) => {
                console.log('[Socket.io] Connecting to', SOCKET_URL, 'for project', projectId);

                const socket = io(SOCKET_URL, {
                    transports: ['websocket', 'polling'],
                    query: { userId: user._id || user.id },
                });

                connectionRef.current = socket;
                channelRef.current    = socket; // for Socket.io, channel === socket

                socket.on('connect', () => {
                    console.log('[Socket.io] Connected:', socket.id);
                    socketRef.current = { id: socket.id };
                    setIsConnected(true);
                    socket.emit('join-project', { projectId });
                });

                socket.on('disconnect', (reason) => {
                    console.log('[Socket.io] Disconnected:', reason);
                    socketRef.current = null;
                    setIsConnected(false);
                });

                socket.on('connect_error', (err) => {
                    console.error('[Socket.io] Connection error:', err.message);
                });
            });

            cleanupFn = () => {
                const socket = connectionRef.current;
                if (socket) socket.disconnect();
                connectionRef.current = null;
                channelRef.current    = null;
                socketRef.current     = null;
                setIsConnected(false);
            };
        }

        return () => cleanupFn();
    }, [projectId, user]);

    // ── Unified event helpers ──────────────────────────────────────────────────
    // For Pusher:    channel.bind(event, cb)   / channel.unbind(event, cb)
    // For Socket.io: socket.on(event, cb)      / socket.off(event, cb)
    // The API is identical — both accept (event, callback).

    const on = useCallback((event, callback) => {
        if (!channelRef.current) return;
        if (USE_PUSHER) {
            channelRef.current.bind(event, callback);
        } else {
            channelRef.current.on(event, callback);
        }
    }, [isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

    const off = useCallback((event, callback) => {
        if (!channelRef.current) return;
        if (USE_PUSHER) {
            channelRef.current.unbind(event, callback);
        } else {
            channelRef.current.off(event, callback);
        }
    }, [isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        socket: socketRef.current,  // value at render time (backward compat)
        socketRef,                  // always-live ref — use this to read socket id
        on,
        off,
        isConnected,
    };
};
