import { sequelize } from '../src/config/database.js';
import { User, Scene, SceneSchedule, Device } from '../src/models/Index.js';

// Set environment to test
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  try {
    // Sync all models
    await sequelize.sync({ force: true });
    
    // Create a test user
    const testUser = await User.create({
      username: 'testuser',
      password: 'testpass123',
      email: 'test@example.com'
    });
    
    // Create a test device
    const testDevice = await Device.create({
      name: 'Test Device',
      type: 'test',
      status: 'offline',
      userId: testUser.id
    });
    
    // Store test user ID and device ID for use in tests
    global.testUserId = testUser.id;
    global.testDeviceId = testDevice.id;
  } catch (error) {
    console.error('Test setup error:', error);
    throw error;
  }
});

// Clean up after tests
afterAll(async () => {
  try {
    await SceneSchedule.destroy({ where: {} });
    await Scene.destroy({ where: {} });
    await Device.destroy({ where: {} });
    await User.destroy({ where: {} });
    await sequelize.close();
  } catch (error) {
    console.error('Test cleanup error:', error);
    throw error;
  }
}); 