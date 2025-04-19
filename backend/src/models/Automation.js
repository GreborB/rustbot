import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import Device from './device.js';
import Scene from './scene.js';

const Automation = sequelize.define('Automation', {
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
    triggers: {
        type: DataTypes.JSON,
        defaultValue: []
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
    schedule: {
        type: DataTypes.STRING,
        validate: {
            isCronExpression(value) {
                // Basic cron expression validation
                if (value && !/^(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)(\s+(\*|[0-9,\-\/]+))?$/.test(value)) {
                    throw new Error('Invalid cron expression');
                }
            }
        }
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

// Automation can have many devices and scenes
Automation.belongsToMany(Device, { through: 'AutomationDevices' });
Device.belongsToMany(Automation, { through: 'AutomationDevices' });

Automation.belongsToMany(Scene, { through: 'AutomationScenes' });
Scene.belongsToMany(Automation, { through: 'AutomationScenes' });

export default Automation; 