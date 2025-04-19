import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

class SceneSchedule extends Model {
  static associate(models) {
    SceneSchedule.belongsTo(models.Scene, { foreignKey: 'sceneId' });
  }

  isActiveNow() {
    if (!this.isActive) return false;

    const now = new Date();
    const start = new Date(this.startTime);
    const end = new Date(this.endTime);

    return now >= start && now <= end;
  }
}

SceneSchedule.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sceneId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Scenes',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  repeat: {
    type: DataTypes.STRING,
    defaultValue: 'none', // none, daily, weekly, monthly
    validate: {
      isIn: [['none', 'daily', 'weekly', 'monthly']]
    }
  },
  daysOfWeek: {
    type: DataTypes.JSON,
    defaultValue: [] // [0-6] for Sunday-Saturday
  },
  daysOfMonth: {
    type: DataTypes.JSON,
    defaultValue: [] // [1-31]
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastExecuted: {
    type: DataTypes.DATE
  },
  nextExecution: {
    type: DataTypes.DATE
  }
}, {
  sequelize,
  modelName: 'SceneSchedule',
  timestamps: true,
  indexes: [
    {
      fields: ['sceneId', 'nextExecution']
    }
  ]
});

export default SceneSchedule; 