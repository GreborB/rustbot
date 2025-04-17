import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupSocketHandlers } from './socketHandlers.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? process.env.CORS_ORIGIN 
            : 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Basic middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.CORS_ORIGIN 
        : 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Socket.IO setup
setupSocketHandlers(io);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 