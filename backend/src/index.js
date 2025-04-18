/**
 * Application entry point
 * @module index
 */

import { startServer } from './server.js';
import config from './config.js';
import { logger } from './utils/logger.js';

// Start the server
startServer().catch(error => {
    logger.error('Failed to start application', error);
    process.exit(1);
}); 