import { jest } from '@jest/globals';
import SceneScheduler from '../../src/services/sceneScheduler.js';
import { Scene, SceneSchedule, User, Device } from '../../src/models/index.js';
import { sequelize } from '../../src/config/database.js';

// Mock sceneService
jest.mock('../../src/services/sceneService.js', () => ({
  executeScene: jest.fn().mockResolvedValue(true),
}));

describe('SceneScheduler', () => {
  let scheduler;
  let testUser;
  let testDevice;
  let testScene;
  let testSchedule;

  beforeAll(async () => {
    // Create test user
    testUser = await User.create({
      username: 'testuser',
      password: 'testpass123',
    });

    // Create test device
    testDevice = await Device.create({
      name: 'Test Device',
      type: 'test',
      status: 'offline',
      userId: testUser.id,
    });

    // Create test scene
    testScene = await Scene.create({
      name: 'Test Scene',
      description: 'Test scene for scheduler tests',
      userId: testUser.id,
      actions: [{
        deviceId: testDevice.id,
        command: 'test-command',
        value: 'test-value'
      }],
    });

    // Create a test schedule
    testSchedule = await SceneSchedule.create({
      sceneId: testScene.id,
      name: 'Test Schedule',
      startTime: new Date(Date.now() + 1000), // 1 second in the future
      repeatType: 'none',
      isActive: true
    });
  });

  beforeEach(() => {
    scheduler = new SceneScheduler();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await scheduler.shutdown();
  });

  afterAll(async () => {
    await SceneSchedule.destroy({ where: {} });
    await Scene.destroy({ where: {} });
    await Device.destroy({ where: {} });
    await User.destroy({ where: {} });
    await sequelize.close();
  });

  describe('initialize', () => {
    it('should load active schedules from the database', async () => {
      await scheduler.initialize();
      expect(scheduler.schedules.size).toBe(1);
      expect(scheduler.schedules.get(testSchedule.id)).toBeDefined();
    });
  });

  describe('addSchedule', () => {
    it('should add a new schedule', async () => {
      const schedule = await scheduler.addSchedule({
        sceneId: testScene.id,
        name: 'Test Schedule',
        description: 'Test schedule',
        startTime: new Date(Date.now() + 1000 * 60 * 5), // 5 minutes from now
        repeatType: 'none',
        repeatDays: [],
        repeatInterval: 1,
        isActive: true,
        userId: testUser.id
      });

      expect(schedule).toBeDefined();
      expect(schedule.sceneId).toBe(testScene.id);
      expect(schedule.name).toBe('Test Schedule');
    });

    it('should throw error for invalid scene', async () => {
      await expect(scheduler.addSchedule({
        sceneId: 999,
        name: 'Test Schedule',
        startTime: new Date(),
        repeatType: 'none',
        userId: testUser.id
      })).rejects.toThrow('Scene not found');
    });
  });

  describe('updateSchedule', () => {
    it('should update an existing schedule', async () => {
      const schedule = await scheduler.addSchedule({
        sceneId: testScene.id,
        name: 'Test Schedule',
        startTime: new Date(),
        repeatType: 'none',
        userId: testUser.id
      });

      const updated = await scheduler.updateSchedule(schedule.id, {
        name: 'Updated Schedule',
        userId: testUser.id
      });

      expect(updated.name).toBe('Updated Schedule');
    });

    it('should throw error for non-existent schedule', async () => {
      await expect(scheduler.updateSchedule(999, {
        name: 'Updated Schedule',
        userId: testUser.id
      })).rejects.toThrow('Schedule not found');
    });
  });

  describe('removeSchedule', () => {
    it('should remove an existing schedule', async () => {
      const schedule = await scheduler.addSchedule({
        sceneId: testScene.id,
        name: 'Test Schedule',
        startTime: new Date(),
        repeatType: 'none',
        userId: testUser.id
      });

      await scheduler.removeSchedule(schedule.id, testUser.id);
      const found = await SceneSchedule.findByPk(schedule.id);
      expect(found).toBeNull();
    });

    it('should throw error for non-existent schedule', async () => {
      await expect(scheduler.removeSchedule(999, testUser.id))
        .rejects.toThrow('Schedule not found');
    });
  });

  describe('getNextExecutionTime', () => {
    it('should calculate next execution time for daily repeat', () => {
      const now = new Date();
      const nextTime = scheduler.getNextExecutionTime({
        startTime: now,
        repeatType: 'daily',
        repeatInterval: 1
      });

      expect(nextTime).toBeInstanceOf(Date);
      expect(nextTime.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should calculate next execution time for weekly repeat', () => {
      const now = new Date();
      const nextTime = scheduler.getNextExecutionTime({
        startTime: now,
        repeatType: 'weekly',
        repeatDays: [now.getDay()],
        repeatInterval: 1
      });

      expect(nextTime).toBeInstanceOf(Date);
      expect(nextTime.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should calculate next execution time for monthly repeat', () => {
      const now = new Date();
      const nextTime = scheduler.getNextExecutionTime({
        startTime: now,
        repeatType: 'monthly',
        repeatInterval: 1
      });

      expect(nextTime).toBeInstanceOf(Date);
      expect(nextTime.getTime()).toBeGreaterThan(now.getTime());
    });
  });

  describe('schedule execution', () => {
    it('should execute scene at scheduled time', async () => {
      const now = new Date();
      const schedule = await scheduler.addSchedule({
        sceneId: testScene.id,
        name: 'Test Schedule',
        startTime: new Date(now.getTime() + 1000), // 1 second from now
        repeatType: 'none',
        userId: testUser.id
      });

      // Wait for execution
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { executeScene } = require('../../src/services/sceneService.js');
      expect(executeScene).toHaveBeenCalledWith(testScene.id);
    });
  });
}); 