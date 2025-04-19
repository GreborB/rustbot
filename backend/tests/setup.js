import { sequelize } from '../src/config/database.js';
import { User, Scene, SceneSchedule } from '../src/models/index.js';

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
    
    // Store test user ID for use in tests
    global.testUserId = testUser.id;
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
    await User.destroy({ where: {} });
    await sequelize.close();
  } catch (error) {
    console.error('Test cleanup error:', error);
    throw error;
  }
}); 