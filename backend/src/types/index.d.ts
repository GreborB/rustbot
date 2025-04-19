// Core configuration types
export interface Config {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: number;
    HOST: string;
    DB_PATH: string;
    DB_LOGGING: boolean;
    JWT_SECRET: string;
    LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug' | 'trace';
    CORS_ORIGIN: string;
    CORS_METHODS: string[];
    CORS_ALLOWED_HEADERS: string[];
    CORS_CREDENTIALS: boolean;
}

// Socket types
export interface SocketConfig {
    MAX_RECONNECT_ATTEMPTS: number;
    COMMAND_RATE_LIMIT: number;
    PING_INTERVAL: number;
    PING_TIMEOUT: number;
    MAX_SOCKETS: number;
    MAX_CONCURRENT_COMMANDS: number;
    COMMAND_QUEUE_SIZE: number;
}

// Vending machine types
export interface VendingMachine {
    id: string;
    name: string;
    items: Map<string, VendingItem>;
    lastUpdated: number;
    errorCount: number;
    lastError: string | null;
    totalItemsSold: number;
    totalValueSold: number;
}

export interface VendingItem {
    quantity: number;
    price: number;
    currency: string;
}

// Error types
export interface AppError extends Error {
    statusCode: number;
    code: string;
    details: Record<string, any>;
    timestamp: string;
    isOperational: boolean;
}

// Logger types
export interface LogEntry {
    level: string;
    message: string;
    timestamp: string;
    metadata?: Record<string, any>;
}

// Authentication types
export interface User {
    id: string;
    username: string;
    role: 'admin' | 'user';
    permissions: string[];
    lastLogin: Date;
}

export interface AuthToken {
    token: string;
    expiresAt: Date;
    userId: string;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: Record<string, any>;
    };
    metadata?: {
        timestamp: string;
        version: string;
    };
}

// Event types
export interface SystemEvent {
    type: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}

// Performance metrics types
export interface PerformanceMetrics {
    cpu: {
        usage: number;
        load: number[];
    };
    memory: {
        total: number;
        used: number;
        free: number;
    };
    network: {
        bytesIn: number;
        bytesOut: number;
        connections: number;
    };
    timestamp: Date;
} 