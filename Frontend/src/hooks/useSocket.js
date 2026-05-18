import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const useSocket = (projectId) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!projectId || !user) return;

    console.log('[Socket] Connecting to', SOCKET_URL, 'for project', projectId);

    // Initialize socket connection — allow both transports for reliability
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      query: {
        userId: user._id || user.id,
      },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      setIsConnected(true);
      // Join room only after connection is established
      socket.emit('join-project', { projectId });
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [projectId, user]);

  // on/off depend on isConnected so they re-bind when socket becomes available
  const on = useCallback((event, callback) => {
    if (!socketRef.current) return;
    socketRef.current.on(event, callback);
  }, [isConnected]);

  const off = useCallback((event, callback) => {
    if (!socketRef.current) return;
    socketRef.current.off(event, callback);
  }, [isConnected]);

  return {
    socket: socketRef.current,
    on,
    off,
    isConnected,
  };
};
