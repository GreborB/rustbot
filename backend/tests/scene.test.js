import axios from 'axios';
import { config } from '../src/config/config.js';

const API_URL = 'http://localhost:3000/api';

describe('Scene Management System', () => {
  let accessToken;
  let testSceneId;
  let testScheduleId;

  // Test user credentials
  const testUser = {
    username: 'testuser',
    password: 'testpass123',
    email: 'test@example.com'
  };

  beforeAll(async () => {
    // Register test user
    try {
      await axios.post(`${API_URL}/users/register`, testUser);
    } catch (error) {
      // User might already exist, try to login
      const response = await axios.post(`${API_URL}/users/login`, {
        username: testUser.username,
        password: testUser.password
      });
      accessToken = response.data.accessToken;
    }
  });

  describe('Scene Operations', () => {
    it('should create a new scene', async () => {
      const sceneData = {
        name: 'Test Scene',
        description: 'A test scene for automated testing',
        actions: [
          {
            deviceId: 'test-device-1',
            command: 'turnOn',
            params: { brightness: 100 }
          }
        ],
        conditions: [
          {
            type: 'time',
            operator: 'between',
            value: ['09:00', '17:00']
          }
        ],
        isActive: true
      };

      const response = await axios.post(`${API_URL}/scenes`, sceneData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.name).toBe(sceneData.name);
      testSceneId = response.data.id;
    });

    it('should get the created scene', async () => {
      const response = await axios.get(`${API_URL}/scenes/${testSceneId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.id).toBe(testSceneId);
      expect(response.data.actions).toHaveLength(1);
    });

    it('should update the scene', async () => {
      const updateData = {
        name: 'Updated Test Scene',
        description: 'Updated description'
      };

      const response = await axios.put(`${API_URL}/scenes/${testSceneId}`, updateData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.name).toBe(updateData.name);
    });

    it('should create a schedule for the scene', async () => {
      const scheduleData = {
        name: 'Test Schedule',
        startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        endTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
        repeat: 'daily',
        isActive: true
      };

      const response = await axios.post(
        `${API_URL}/scenes/${testSceneId}/schedules`,
        scheduleData,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      testScheduleId = response.data.id;
    });

    it('should execute the scene', async () => {
      const response = await axios.post(
        `${API_URL}/scenes/${testSceneId}/execute`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.message).toBe('Scene executed successfully');
    });

    it('should delete the schedule', async () => {
      const response = await axios.delete(
        `${API_URL}/scenes/${testSceneId}/schedules/${testScheduleId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      expect(response.status).toBe(204);
    });

    it('should delete the scene', async () => {
      const response = await axios.delete(`${API_URL}/scenes/${testSceneId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      expect(response.status).toBe(204);
    });
  });
}); 