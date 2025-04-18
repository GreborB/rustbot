import { loggerInstance as logger } from './logger.js';

// Configuration for day/night cycle
const TIME_CONFIG = {
    NIGHT_START_HOUR: 18,
    NIGHT_END_HOUR: 6,
    TIME_FORMAT: {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
    }
};

/**
 * Format a duration in milliseconds to a human-readable string
 * @param {number} duration - Duration in milliseconds
 * @returns {string} Formatted duration string
 */
function formatDuration(duration) {
    try {
        const hours = Math.floor(duration / (60 * 60 * 1000));
        const minutes = Math.floor((duration % (60 * 60 * 1000)) / (60 * 1000));
        return `${hours}h${minutes.toString().padStart(2, '0')}m`;
    } catch (error) {
        logger.error('Error formatting duration:', error);
        return '??:??';
    }
}

/**
 * Get current server time in 24-hour format
 * @returns {string} Current time in HH:mm format
 */
function getServerTime() {
    try {
        return new Date().toLocaleTimeString([], TIME_CONFIG.TIME_FORMAT);
    } catch (error) {
        logger.error('Error getting server time:', error);
        return '??:??';
    }
}

/**
 * Calculate time until next day/night transition
 * @returns {Object} Object containing transition info
 */
function getTimeUntilTransition() {
    try {
        const now = new Date();
        const hours = now.getHours();
        
        // Determine if it's currently day or night
        const isDaytime = hours >= TIME_CONFIG.NIGHT_END_HOUR && hours < TIME_CONFIG.NIGHT_START_HOUR;
        
        // Calculate next transition time
        const transitionTime = new Date();
        if (isDaytime) {
            // During day, calculate time until night
            transitionTime.setHours(TIME_CONFIG.NIGHT_START_HOUR, 0, 0, 0);
            if (transitionTime < now) {
                transitionTime.setDate(transitionTime.getDate() + 1);
            }
        } else {
            // During night, calculate time until morning
            transitionTime.setHours(TIME_CONFIG.NIGHT_END_HOUR, 0, 0, 0);
            if (transitionTime < now) {
                transitionTime.setDate(transitionTime.getDate() + 1);
            }
        }
        
        const timeUntilTransition = transitionTime - now;
        
        return {
            isDaytime,
            timeUntilTransition,
            formattedTime: formatDuration(timeUntilTransition),
            transitionType: isDaytime ? 'night' : 'morning'
        };
    } catch (error) {
        logger.error('Error calculating time until transition:', error);
        return {
            isDaytime: false,
            timeUntilTransition: 0,
            formattedTime: '??:??',
            transitionType: 'unknown'
        };
    }
}

/**
 * Get human-readable string for time until next day/night transition
 * @returns {string} Time until next transition
 */
function getTimeUntilNight() {
    const transition = getTimeUntilTransition();
    return `${transition.transitionType.charAt(0).toUpperCase() + transition.transitionType.slice(1)} starts in ${transition.formattedTime}`;
}

// Export frozen object to prevent modifications
export default Object.freeze({
    getServerTime,
    getTimeUntilNight,
    getTimeUntilTransition,
    TIME_CONFIG
}); 