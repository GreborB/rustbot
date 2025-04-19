import { logger } from './logger.js';

class CircuitBreaker {
    constructor(options = {}) {
        this.failureThreshold = options.failureThreshold || 5;
        this.resetTimeout = options.resetTimeout || 60000; // 1 minute
        this.failures = 0;
        this.lastFailureTime = null;
        this.isOpen = false;
    }

    recordFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();
        
        if (this.failures >= this.failureThreshold) {
            this.isOpen = true;
            logger.warn('Circuit breaker opened due to too many failures');
            
            // Schedule reset
            setTimeout(() => {
                this.reset();
            }, this.resetTimeout);
        }
    }

    recordSuccess() {
        this.failures = 0;
        this.isOpen = false;
    }

    reset() {
        this.failures = 0;
        this.isOpen = false;
        this.lastFailureTime = null;
        logger.info('Circuit breaker reset');
    }

    canExecute() {
        if (!this.isOpen) {
            return true;
        }

        // Check if we should reset
        if (this.lastFailureTime && (Date.now() - this.lastFailureTime) >= this.resetTimeout) {
            this.reset();
            return true;
        }

        return false;
    }

    async execute(fn) {
        if (!this.canExecute()) {
            throw new Error('Circuit breaker is open');
        }

        try {
            const result = await fn();
            this.recordSuccess();
            return result;
        } catch (error) {
            this.recordFailure();
            throw error;
        }
    }
}

export const createCircuitBreaker = (options) => {
    return new CircuitBreaker(options);
}; 