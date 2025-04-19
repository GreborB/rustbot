import { sequelize } from '../src/models/index.js';

// Set environment to test
process.env.NODE_ENV = 'test';

// Set up test database
beforeAll(async () => {
  // Sync all models
  await sequelize.sync({ force: true });
});

// Clean up after tests
afterAll(async () => {
  await sequelize.close();
}); 