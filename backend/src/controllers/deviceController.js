import { Router } from 'express';
import Device from '../models/Device.js';
import { AppError } from '../utils/errorHandlers.js';
import logger from '../utils/logger.js';
import { socketManager } from '../socketHandlers.js';
import { cache } from '../utils/cache.js';

const router = Router();

/**
 * Device Controller
 * Handles all device-related operations
 */
class DeviceController {
    /**
     * Create a new device
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async createDevice(req, res, next) {
        try {
            const { name, type, location, status, settings } = req.body;
            const cacheKey = `device:${name}`;

            // Check if device already exists using cache first
            const cachedDevice = await cache.get(cacheKey);
            if (cachedDevice) {
                throw new AppError('Device already exists', 400, 'DEVICE_EXISTS');
            }

            const existingDevice = await Device.findOne({ name });
            if (existingDevice) {
                await cache.set(cacheKey, existingDevice, 300);
                throw new AppError('Device already exists', 400, 'DEVICE_EXISTS');
            }

            const device = new Device({
                name,
                type,
                location,
                status: status || 'inactive',
                settings: settings || {},
                createdBy: req.user.id
            });

            await device.save();
            await cache.set(cacheKey, device, 300);

            // Notify connected clients
            socketManager.broadcastDeviceUpdate(device);

            logger.info('Device created successfully', { deviceId: device._id });

            res.status(201).json({
                success: true,
                data: {
                    device: this._formatDeviceResponse(device)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update device details
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async updateDevice(req, res, next) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const device = await Device.findByIdAndUpdate(
                id,
                { $set: updates },
                { new: true, runValidators: true }
            );

            if (!device) {
                throw new AppError('Device not found', 404, 'DEVICE_NOT_FOUND');
            }

            // Notify connected clients
            socketManager.broadcastDeviceUpdate(device);

            logger.info('Device updated successfully', { deviceId: device._id });

            res.json({
                success: true,
                data: {
                    device: {
                        id: device._id,
                        name: device.name,
                        type: device.type,
                        location: device.location,
                        status: device.status,
                        settings: device.settings
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get device details
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async getDevice(req, res, next) {
        try {
            const { id } = req.params;
            const cacheKey = `device:${id}`;

            let device = await cache.get(cacheKey);
            if (!device) {
                device = await Device.findById(id);
                if (!device) {
                    throw new AppError('Device not found', 404, 'DEVICE_NOT_FOUND');
                }
                await cache.set(cacheKey, device, 300);
            }

            res.json({
                success: true,
                data: {
                    device: this._formatDeviceResponse(device)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete device
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async deleteDevice(req, res, next) {
        try {
            const { id } = req.params;
            const device = await Device.findByIdAndDelete(id);
            
            if (!device) {
                throw new AppError('Device not found', 404, 'DEVICE_NOT_FOUND');
            }

            // Clear device-related caches
            await Promise.all([
                cache.del(`device:${device.name}`),
                cache.del(`device:${id}`)
            ]);

            // Notify connected clients
            socketManager.broadcastDeviceDeletion(id);

            logger.info('Device deleted successfully', { deviceId: device._id });

            res.json({
                success: true,
                data: null
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * List all devices
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async listDevices(req, res, next) {
        try {
            const { page = 1, limit = 10, type, status, location } = req.query;
            const skip = (page - 1) * limit;
            const cacheKey = `devices:list:${page}:${limit}:${type}:${status}:${location}`;

            // Build query
            const query = {};
            if (type) query.type = type;
            if (status) query.status = status;
            if (location) query.location = location;

            let devices = await cache.get(cacheKey);
            if (!devices) {
                devices = await Device.find(query)
                    .skip(skip)
                    .limit(limit)
                    .sort({ createdAt: -1 });
                
                await cache.set(cacheKey, devices, 60); // Cache for 1 minute
            }

            const total = await Device.countDocuments(query);

            res.json({
                success: true,
                data: {
                    devices: devices.map(device => this._formatDeviceResponse(device)),
                    pagination: {
                        total,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        pages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update device status
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async updateDeviceStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const cacheKey = `device:${id}`;

            const device = await Device.findByIdAndUpdate(
                id,
                { $set: { status } },
                { new: true, runValidators: true }
            );

            if (!device) {
                throw new AppError('Device not found', 404, 'DEVICE_NOT_FOUND');
            }

            // Update cache
            await cache.set(cacheKey, device, 300);

            // Notify connected clients
            socketManager.broadcastDeviceUpdate(device);

            logger.info('Device status updated', { deviceId: device._id, status });

            res.json({
                success: true,
                data: {
                    device: this._formatDeviceResponse(device)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get device status
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async getStatus(req, res, next) {
        try {
            const { id } = req.params;
            const device = await Device.findById(id);
            
            if (!device) {
                throw new AppError('Device not found', 404, 'DEVICE_NOT_FOUND');
            }

            const status = await socketManager.getDeviceStatus(id);
            res.json({ status });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Send command to device
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async sendCommand(req, res, next) {
        try {
            const { id } = req.params;
            const { command, parameters } = req.body;

            const device = await Device.findById(id);
            if (!device) {
                throw new AppError('Device not found', 404, 'DEVICE_NOT_FOUND');
            }

            // Send command through socket manager
            const result = await socketManager.sendDeviceCommand(id, command, parameters);

            logger.info('Command sent to device', { deviceId: id, command });

            res.json({
                success: true,
                data: { result }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Format device response
     * @private
     */
    _formatDeviceResponse(device) {
        return {
            id: device._id,
            name: device.name,
            type: device.type,
            location: device.location,
            status: device.status,
            settings: device.settings,
            lastUpdated: device.updatedAt,
            createdAt: device.createdAt
        };
    }
}

const deviceController = new DeviceController();

// Routes
router.post('/', deviceController.createDevice.bind(deviceController));
router.get('/', deviceController.listDevices.bind(deviceController));
router.get('/:id', deviceController.getDevice.bind(deviceController));
router.put('/:id', deviceController.updateDevice.bind(deviceController));
router.delete('/:id', deviceController.deleteDevice.bind(deviceController));
router.post('/:id/command', deviceController.sendCommand.bind(deviceController));
router.get('/:id/status', deviceController.getStatus.bind(deviceController));

export { router as deviceController }; 