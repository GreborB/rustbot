import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupSocketHandlers } from './socketHandlers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);

// Configure CORS and Socket.IO
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.CORS_ORIGIN 
        : 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
};

const io = new Server(httpServer, { cors: corsOptions });

// Log all incoming requests
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});

// Basic middleware
app.use(cors(corsOptions));
app.use(express.json());

// Serve static files from the frontend build directory
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Health check endpoint
app.get('/health', (req, res) => {
    console.log('✅ Health check requested');
    res.json({ status: 'ok' });
});

// Socket.IO setup
setupSocketHandlers(io);

// Catch-all route for client-side routing
app.get('/:path*', (req, res) => {
    console.log(`🌐 Serving index.html for ${req.path}`);
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 WebUI available at http://localhost:${PORT}`);
    console.log(`🔌 Socket.IO server ready for connections`);
    console.log(`📁 Serving static files from ${path.join(__dirname, '../../frontend/dist')}`);
}); 