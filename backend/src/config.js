export default {
    PORT: process.env.PORT || 3001,
    BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
    SESSION_SECRET: process.env.SESSION_SECRET || 'your-secret-key',
    STEAM_API_KEY: process.env.STEAM_API_KEY,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/rustbot',
    NODE_ENV: process.env.NODE_ENV || 'development'
}; 