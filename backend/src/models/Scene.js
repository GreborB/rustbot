import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import Device from './device.js';

const Scene = sequelize.define('Scene', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 50]
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  actions: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastTriggered: {
    type: DataTypes.DATE
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  timestamps: true,
  paranoid: true, // Soft deletes
  indexes: [
    {
      unique: true,
      fields: ['name']
    }
  ]
});

// Scene can have many devices
Scene.belongsToMany(Device, { through: 'SceneDevices' });
Device.belongsToMany(Scene, { through: 'SceneDevices' });

export default Scene; 