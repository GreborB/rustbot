import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import User from './User.js';
import Device from './Device.js';

const Scene = sequelize.define('Scene', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 100],
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  actions: {
    type: DataTypes.JSON,
    defaultValue: [],
    validate: {
      isValidActions(value) {
        if (!Array.isArray(value)) {
          throw new Error('Actions must be an array');
        }
        if (value.length === 0) {
          throw new Error('Scene must have at least one action');
        }
        value.forEach(action => {
          if (!action.deviceId || !action.command) {
            throw new Error('Each action must have deviceId and command');
          }
        });
      },
    },
  },
  schedule: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  lastRunAt: {
    type: DataTypes.DATE,
  },
});

// Define associations
Scene.belongsTo(User, {
  foreignKey: {
    name: 'userId',
    allowNull: false,
  },
  onDelete: 'CASCADE',
});

User.hasMany(Scene, {
  foreignKey: 'userId',
});

Scene.belongsToMany(Device, {
  through: 'SceneDevices',
  as: 'devices',
});

Device.belongsToMany(Scene, {
  through: 'SceneDevices',
  as: 'scenes',
});

export default Scene; 