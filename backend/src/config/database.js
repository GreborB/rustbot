import { Sequelize } from 'sequelize';
import { config } from './config.js';
import { logger } from '../utils/logger.js';
import path from 'path';
import fs from 'fs';

// Ensure database directory exists
const dbDir = path.dirname(config.database.storage);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

export const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: config.database.storage,
    logging: config.database.logging ? (msg) => logger.debug(msg) : false,
    dialectModule: require('better-sqlite3'),
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    retry: {
        max: 3
    }
});

export const initDatabase = async () => {
    try {
        await sequelize.authenticate();
        logger.info('Database connection has been established successfully.');
        
        // Sync all models with the database
        const syncOptions = {
            alter: process.env.NODE_ENV === 'development',
            force: process.env.NODE_ENV === 'test'
        };
        
        await sequelize.sync(syncOptions);
        logger.info('Database models synchronized successfully.');
    } catch (error) {
        logger.error('Unable to connect to the database:', error);
        throw error;
    }
}; 