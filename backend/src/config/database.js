import { Sequelize } from 'sequelize';
import { config } from './config.js';
import { logger } from '../utils/logger.js';

export const sequelize = new Sequelize({
  dialect: config.database.dialect,
  storage: config.database.storage,
  logging: config.database.logging ? (msg) => logger.debug(msg) : false,
  define: config.database.define,
});

export const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
    
    // Sync all models with the database
    await sequelize.sync({ alter: true });
    logger.info('Database models synchronized successfully.');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
}; 