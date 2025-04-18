import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { loggerInstance as logger } from '../utils/logger';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000;

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL;
    const newSocket = io(API_URL, {
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: reconnectDelay,
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      logger.info('Socket connected');
      setIsConnected(true);
      setReconnectAttempts(0);
    });

    newSocket.on('disconnect', (reason) => {
      logger.warn('Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      logger.error('Socket connection error:', error);
    });

    newSocket.on('error', (error) => {
      logger.error('Socket error:', error);
    });

    newSocket.on('reconnect_attempt', (attempt) => {
      setReconnectAttempts(attempt);
      logger.info('Socket reconnection attempt:', attempt);
    });

    newSocket.on('reconnect_failed', () => {
      logger.error('Socket reconnection failed after', maxReconnectAttempts, 'attempts');
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.close();
        logger.info('Socket connection closed');
      }
    };
  }, []);

  const value = {
    socket,
    isConnected,
    reconnectAttempts,
    maxReconnectAttempts,
    emit: (event, data) => {
      if (!socket || !isConnected) {
        throw new Error('Socket not connected');
      }
      socket.emit(event, data);
    },
    on: (event, callback) => {
      if (!socket) {
        throw new Error('Socket not initialized');
      }
      socket.on(event, callback);
    },
    off: (event, callback) => {
      if (!socket) {
        throw new Error('Socket not initialized');
      }
      socket.off(event, callback);
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 