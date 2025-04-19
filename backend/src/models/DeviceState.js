import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

class DeviceState extends Model {
  static associate(models) {
    DeviceState.belongsTo(models.Device, { foreignKey: 'deviceId' });
  }
}

DeviceState.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  deviceId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Devices',
      key: 'id'
    }
  },
  command: {
    type: DataTypes.STRING,
    allowNull: false
  },
  params: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  previousState: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  newState: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  source: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'manual'
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'DeviceState',
  timestamps: true,
  indexes: [
    {
      fields: ['deviceId', 'timestamp']
    }
  ]
});

export default DeviceState; 