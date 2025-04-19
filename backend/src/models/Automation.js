import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import User from './User.js';
import Scene from './Scene.js';
import Device from './Device.js';

const Automation = sequelize.define('Automation', {
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
    trigger: {
        type: DataTypes.JSON,
        allowNull: false,
        validate: {
            isValidTrigger(value) {
                if (!value.type) {
                    throw new Error('Trigger must have a type');
                }
                if (!value.condition) {
                    throw new Error('Trigger must have a condition');
                }
            },
        },
    },
    action: {
        type: DataTypes.JSON,
        allowNull: false,
        validate: {
            isValidAction(value) {
                if (!value.type) {
                    throw new Error('Action must have a type');
                }
                if (!value.target) {
                    throw new Error('Action must have a target');
                }
            },
        },
    },
    lastTriggeredAt: {
        type: DataTypes.DATE,
    },
});

// Define associations
Automation.belongsTo(User, {
    foreignKey: {
        name: 'userId',
        allowNull: false,
    },
    onDelete: 'CASCADE',
});

User.hasMany(Automation, {
    foreignKey: 'userId',
});

Automation.belongsTo(Device, {
    foreignKey: 'triggerDeviceId',
    as: 'triggerDevice',
});

Automation.belongsTo(Scene, {
    foreignKey: 'actionSceneId',
    as: 'actionScene',
});

export default Automation; 