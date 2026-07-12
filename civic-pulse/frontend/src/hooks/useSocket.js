import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

// Dynamically set backend URL based on where frontend is accessed from
const getBackendUrl = () => {
  const host = window.location.hostname;
  const protocol = window.location.protocol;
  return `${protocol}//${host}:5000`;
};

const SOCKET_URL = import.meta.env.VITE_API_URL || getBackendUrl();

export function useSocket(userId, userRole) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    // Create socket connection with user info in query params
    const newSocket = io(SOCKET_URL, {
      query: {
        user_id: userId,
        role: userRole || 'citizen'
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    // Connection event
    newSocket.on('connect', () => {
      console.log('WebSocket connected:', newSocket.id);
      setIsConnected(true);
    });

    // Disconnection event
    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    // Connection error
    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Connection status
    newSocket.on('connection_status', (data) => {
      console.log('Connection status:', data);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [userId, userRole]);

  const watchComplaint = (complaintId) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('watch_complaint', {
        complaint_id: complaintId,
        user_id: userId
      });
    }
  };

  const unwatchComplaint = (complaintId) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('unwatch_complaint', {
        complaint_id: complaintId,
        user_id: userId
      });
    }
  };

  const getActiveUsers = () => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('get_active_users');
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    watchComplaint,
    unwatchComplaint,
    getActiveUsers
  };
}
