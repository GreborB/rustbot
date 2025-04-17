import { io } from 'socket.io-client';

const socket = io('http://129.151.212.105:3001', {
  withCredentials: true,
  transports: ['websocket', 'polling']
});

export default socket; 