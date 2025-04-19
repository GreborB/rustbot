import { Op } from 'sequelize';
import { Scene, SceneSchedule } from '../models/index.js';
import { logger } from '../utils/logger.js';
import { sceneService } from './sceneService.js';

class SceneScheduler {
  constructor() {
    this.schedules = new Map();
    this.timeouts = new Map();
    this.interval = null;
  }

  async initialize() {
    try {
      // Load all active schedules from the database
      const schedules = await SceneSchedule.findAll({
        where: { isActive: true },
        include: [Scene]
      });

      // Add each schedule to the scheduler
      for (const schedule of schedules) {
        this.addSchedule(schedule);
      }

      // Start the interval to check for schedules
      this.startInterval();

      logger.info('Scene scheduler initialized');
    } catch (error) {
      logger.error('Failed to initialize scene scheduler:', error);
    }
  }

  startInterval() {
    // Check for schedules every minute
    this.interval = setInterval(() => {
      this.checkSchedules();
    }, 60000);
  }

  stopInterval() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  addSchedule(schedule) {
    try {
      // Calculate next execution time
      const nextExecution = this.calculateNextExecution(schedule);
      
      if (!nextExecution) {
        logger.warn(`No valid execution time found for schedule ${schedule.id}`);
        return;
      }

      // Store the schedule
      this.schedules.set(schedule.id, {
        schedule,
        nextExecution
      });

      // Set timeout for next execution
      this.setTimeout(schedule.id, nextExecution);

      logger.info(`Added schedule ${schedule.id} with next execution at ${nextExecution}`);
    } catch (error) {
      logger.error(`Failed to add schedule ${schedule.id}:`, error);
    }
  }

  updateSchedule(schedule) {
    // Remove existing schedule
    this.removeSchedule(schedule.id);
    
    // Add updated schedule
    this.addSchedule(schedule);
  }

  removeSchedule(scheduleId) {
    // Clear existing timeout
    const timeout = this.timeouts.get(scheduleId);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(scheduleId);
    }

    // Remove from schedules
    this.schedules.delete(scheduleId);

    logger.info(`Removed schedule ${scheduleId}`);
  }

  setTimeout(scheduleId, executionTime) {
    const now = new Date();
    const delay = executionTime.getTime() - now.getTime();

    if (delay <= 0) {
      logger.warn(`Schedule ${scheduleId} execution time is in the past`);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const scheduleData = this.schedules.get(scheduleId);
        if (!scheduleData) return;

        const { schedule } = scheduleData;

        // Execute the scene
        await sceneService.executeScene(schedule.scene);

        // Calculate next execution time
        const nextExecution = this.calculateNextExecution(schedule);
        
        if (nextExecution) {
          // Update next execution time
          this.schedules.set(scheduleId, {
            schedule,
            nextExecution
          });

          // Set new timeout
          this.setTimeout(scheduleId, nextExecution);
        } else {
          // No more executions, remove the schedule
          this.removeSchedule(scheduleId);
        }
      } catch (error) {
        logger.error(`Failed to execute schedule ${scheduleId}:`, error);
      }
    }, delay);

    this.timeouts.set(scheduleId, timeout);
  }

  calculateNextExecution(schedule) {
    const now = new Date();
    const startTime = new Date(schedule.startTime);
    const endTime = schedule.endTime ? new Date(schedule.endTime) : null;

    // If schedule has ended, return null
    if (endTime && now > endTime) {
      return null;
    }

    // If schedule hasn't started yet, return start time
    if (now < startTime) {
      return startTime;
    }

    // Calculate next execution based on repeat type
    switch (schedule.repeatType) {
      case 'none':
        return startTime > now ? startTime : null;

      case 'daily':
        return this.calculateDailyExecution(now, startTime, endTime);

      case 'weekly':
        return this.calculateWeeklyExecution(now, startTime, endTime, schedule.repeatDays);

      case 'monthly':
        return this.calculateMonthlyExecution(now, startTime, endTime, schedule.repeatDay);

      default:
        logger.warn(`Invalid repeat type for schedule ${schedule.id}`);
        return null;
    }
  }

  calculateDailyExecution(now, startTime, endTime) {
    const nextExecution = new Date(now);
    nextExecution.setHours(startTime.getHours());
    nextExecution.setMinutes(startTime.getMinutes());
    nextExecution.setSeconds(0);
    nextExecution.setMilliseconds(0);

    if (nextExecution <= now) {
      nextExecution.setDate(nextExecution.getDate() + 1);
    }

    if (endTime && nextExecution > endTime) {
      return null;
    }

    return nextExecution;
  }

  calculateWeeklyExecution(now, startTime, endTime, repeatDays) {
    if (!repeatDays || repeatDays.length === 0) {
      return null;
    }

    const nextExecution = new Date(now);
    nextExecution.setHours(startTime.getHours());
    nextExecution.setMinutes(startTime.getMinutes());
    nextExecution.setSeconds(0);
    nextExecution.setMilliseconds(0);

    // Find the next valid day
    let daysToAdd = 0;
    const currentDay = nextExecution.getDay();
    const validDays = repeatDays.sort((a, b) => a - b);

    for (const day of validDays) {
      if (day > currentDay || (day === currentDay && nextExecution > now)) {
        daysToAdd = day - currentDay;
        break;
      }
    }

    if (daysToAdd === 0) {
      // No valid days found this week, move to next week
      daysToAdd = 7 - currentDay + validDays[0];
    }

    nextExecution.setDate(nextExecution.getDate() + daysToAdd);

    if (endTime && nextExecution > endTime) {
      return null;
    }

    return nextExecution;
  }

  calculateMonthlyExecution(now, startTime, endTime, repeatDay) {
    if (!repeatDay || repeatDay < 1 || repeatDay > 31) {
      return null;
    }

    const nextExecution = new Date(now);
    nextExecution.setHours(startTime.getHours());
    nextExecution.setMinutes(startTime.getMinutes());
    nextExecution.setSeconds(0);
    nextExecution.setMilliseconds(0);

    // Set to the specified day of the month
    nextExecution.setDate(repeatDay);

    // If the calculated date is in the past, move to next month
    if (nextExecution <= now) {
      nextExecution.setMonth(nextExecution.getMonth() + 1);
    }

    if (endTime && nextExecution > endTime) {
      return null;
    }

    return nextExecution;
  }

  checkSchedules() {
    const now = new Date();
    for (const [scheduleId, scheduleData] of this.schedules.entries()) {
      const { nextExecution } = scheduleData;
      if (nextExecution <= now) {
        this.executeSchedule(scheduleId);
      }
    }
  }

  async shutdown() {
    this.stopInterval();
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();
    this.schedules.clear();
    logger.info('Scene scheduler shut down');
  }
}

export default SceneScheduler; 