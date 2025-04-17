import { io } from 'socket.io-client';

const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
const socketUrl = wsUrl.replace('ws://', 'http://').replace('wss://', 'https://');

export const socketService = io(socketUrl, {
  withCredentials: true,
  transports: ['websocket', 'polling']
}); 