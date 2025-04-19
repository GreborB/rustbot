import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Device = sequelize.define('Device', {
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
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'offline'
  },
  ipAddress: {
    type: DataTypes.STRING,
    validate: {
      isIP: true
    }
  },
  port: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 65535
    }
  },
  lastSeen: {
    type: DataTypes.DATE
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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

export default Device;