import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

const env = process.env.NODE_ENV || 'development';

export const config = {
  server: {
    port: process.env.PORT || 3000,
    env
  },
  database: {
    dialect: 'sqlite',
    storage: path.join(process.cwd(), 'database.sqlite'),
    logging: env === 'development'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    resetSecret: process.env.JWT_RESET_SECRET || 'your-reset-secret-key',
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
    expiresIn: '24h'
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    loginWindowMs: 60 * 60 * 1000, // 1 hour
    maxLoginAttempts: 5 // limit login attempts
  },
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || 'noreply@kinabot.com'
  },
  // Logging configuration
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Cache configuration
  cache: {
    ttl: 60 * 60, // 1 hour in seconds
  },
  
  // File upload configuration
  upload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
  },
  
  // WebSocket configuration
  ws: {
    path: '/ws',
    pingInterval: 30000, // 30 seconds
    pingTimeout: 5000, // 5 seconds
  },
}; 