require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { setupSocketHandlers } = require('./socketHandlers');

const app = express();
const server = http.createServer(app);

// Add health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['http://129.151.212.105:3000'] 
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  }
});

// Setup socket handlers
setupSocketHandlers(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
}); 