import { Server } from "socket.io";
import http from "http";

let io;

/**
 * Initializes the Socket.io server and attaches it to the HTTP server.
 * @param {http.Server} server - The Node HTTP server instance.
 */
export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // In production, this should be restricted to the frontend URL
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log(`New socket connection: ${socket.id}`);

        socket.on("join-project", ({ projectId }) => {
            if (projectId) {
                socket.join(`project:${projectId}`);
                console.log(`Socket ${socket.id} joined room project:${projectId}`);
            }
        });

        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

/**
 * Emits an event to all users in a specific project room.
 * @param {string} projectId - The ID of the project.
 * @param {string} event - The name of the event to emit.
 * @param {Object} data - The data to send with the event.
 * @param {string} [excludeSocketId] - Optional socket ID to exclude from the broadcast.
 */
export const emitToProject = (projectId, event, data, excludeSocketId) => {
    if (!io) {
        console.error("Socket.io server not initialized. Cannot emit event.");
        return;
    }
    const room = `project:${projectId}`;
    const socketsInRoom = io.sockets.adapter.rooms.get(room);
    const count = socketsInRoom ? socketsInRoom.size : 0;
    console.log(`[Socket] Emitting "${event}" to room "${room}" (${count} socket(s), exclude: ${excludeSocketId || 'none'})`, data);

    if (excludeSocketId) {
        // Broadcast to the room but skip the originating tab's socket
        io.to(room).except(excludeSocketId).emit(event, data);
    } else {
        io.to(room).emit(event, data);
    }
};
