import { toast } from 'react-toastify';
import socketService from '../services/socket.js';

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  CONNECTION_STATUS: 'connectionStatus',
  SERVER_PAIRED: 'serverPaired',
  PAIRING_ERROR: 'pairingError',
  RUST_ERROR: 'rustError',
  PLAYER_COUNT: 'playerCount',
  ONLINE_PLAYERS: 'onlinePlayers',
  RECENT_EVENTS: 'recentEvents',
  COMMAND_STATS: 'commandStats'
};

export const SOCKET_TIMEOUTS = {
  CONNECTION: 10000, // 10 seconds
  PAIRING: 30000,   // 30 seconds
  RECONNECT: 5000   // 5 seconds
};

export const handleSocketError = (error, setError, setIsLoading) => {
  console.error('Socket error:', error);
  const errorMessage = error.message || 'An unexpected error occurred';
  setError(errorMessage);
  setIsLoading(false);
  toast.error(errorMessage);
};

export const setupSocketEventListeners = (handlers) => {
  const cleanupFunctions = [];
  const eventIds = new Map();

  Object.entries(handlers).forEach(([event, handler]) => {
    const eventId = `${event}_${Date.now()}`;
    eventIds.set(event, eventId);
    
    const wrappedHandler = (...args) => {
      try {
        handler(...args);
      } catch (error) {
        console.error(`Error in ${event} handler:`, error);
        toast.error(`Error handling ${event}: ${error.message}`);
      }
    };

    socketService.on(event, wrappedHandler);
    cleanupFunctions.push(() => {
      socketService.off(event, wrappedHandler);
      eventIds.delete(event);
    });
  });

  return () => {
    cleanupFunctions.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    });
    cleanupFunctions.length = 0;
    eventIds.clear();
  };
};

export const waitForSocketConnection = async () => {
  if (socketService.isConnected) {
    return true;
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Socket connection timeout'));
    }, SOCKET_TIMEOUTS.CONNECTION);

    const checkConnection = () => {
      if (socketService.isConnected) {
        clearTimeout(timeout);
        resolve(true);
      } else {
        setTimeout(checkConnection, 100);
      }
    };

    checkConnection();
  });
};

export const emitWithRetry = async (event, data, maxRetries = 3) => {
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      await waitForSocketConnection();
      socketService.emit(event, data);
      return;
    } catch (error) {
      retryCount++;
      if (retryCount === maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, SOCKET_TIMEOUTS.RECONNECT));
    }
  }
}; 