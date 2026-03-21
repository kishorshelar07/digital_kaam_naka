/**
 * ================================================================
 * hooks/useSocket.js — Socket.IO Client Hook
 * Connects to server, authenticates, and registers event listeners.
 * Used in App.jsx to wire real-time events to context.
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

/**
 * @desc    Custom hook for Socket.IO connection
 * @param   {string} token - JWT access token for auth
 * @param   {Object} handlers - Event handler callbacks
 * @returns {Object} { socket, emit }
 */
const useSocket = (token, handlers = {}) => {
  const socketRef = useRef(null);

  const connect = useCallback(() => {
    if (!token) return;

    // Disconnect existing connection before creating new one
    if (socketRef.current) socketRef.current.disconnect();

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });

    // ── Register server event handlers ───────────────────────
    if (handlers.onNewBookingRequest) {
      socket.on('new_booking_request', handlers.onNewBookingRequest);
    }
    if (handlers.onBookingAccepted) {
      socket.on('booking_accepted', handlers.onBookingAccepted);
    }
    if (handlers.onBookingRejected) {
      socket.on('booking_rejected', handlers.onBookingRejected);
    }
    if (handlers.onWorkStarted) {
      socket.on('work_started', handlers.onWorkStarted);
    }
    if (handlers.onWorkCompleted) {
      socket.on('work_completed', handlers.onWorkCompleted);
    }
    if (handlers.onPaymentReceived) {
      socket.on('payment_received', handlers.onPaymentReceived);
    }
    if (handlers.onWorkerStatusUpdated) {
      socket.on('worker_status_updated', handlers.onWorkerStatusUpdated);
    }
    if (handlers.onWorkerLocation) {
      socket.on('worker_location', handlers.onWorkerLocation);
    }
  }, [token]);

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [connect]);

  /**
   * @desc    Emit an event to the server
   */
  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  /**
   * @desc    Join a booking room for real-time updates
   */
  const joinBookingRoom = useCallback((bookingId) => {
    emit('join_booking_room', bookingId);
  }, [emit]);

  /**
   * @desc    Broadcast worker availability status
   */
  const updateWorkerStatus = useCallback((workerId, isAvailable, lat, lng) => {
    emit(isAvailable ? 'worker_online' : 'worker_offline', { workerId, latitude: lat, longitude: lng });
  }, [emit]);

  return { socket: socketRef.current, emit, joinBookingRoom, updateWorkerStatus };
};

export default useSocket;
