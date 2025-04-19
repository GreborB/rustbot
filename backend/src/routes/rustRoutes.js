import express from 'express';
import { authenticate } from '../middleware/auth.js';
import rustService from '../services/rustService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Initiate Rust+ pairing
router.post('/pair', authenticate, async (req, res) => {
    try {
        const { serverIp, serverPort } = req.body;
        const pairingInfo = await rustService.initiatePairing(req.user.id, serverIp, serverPort);
        res.json(pairingInfo);
    } catch (error) {
        logger.error('Pairing initiation error:', error);
        res.status(500).json({ error: 'Failed to initiate pairing' });
    }
});

// Get pairing status
router.get('/pair/status', authenticate, async (req, res) => {
    try {
        const status = await rustService.getPairingStatus(req.user.id);
        res.json(status);
    } catch (error) {
        logger.error('Pairing status error:', error);
        res.status(500).json({ error: 'Failed to get pairing status' });
    }
});

// Get server info
router.get('/server/info', authenticate, async (req, res) => {
    try {
        const info = await rustService.getServerInfo();
        res.json(info);
    } catch (error) {
        logger.error('Server info error:', error);
        res.status(500).json({ error: 'Failed to get server info' });
    }
});

// Get entity info
router.get('/entity/:id', authenticate, async (req, res) => {
    try {
        const info = await rustService.getEntityInfo(req.params.id);
        res.json(info);
    } catch (error) {
        logger.error('Entity info error:', error);
        res.status(500).json({ error: 'Failed to get entity info' });
    }
});

// Set entity value
router.post('/entity/:id/value', authenticate, async (req, res) => {
    try {
        const { value } = req.body;
        await rustService.setEntityValue(req.params.id, value);
        res.json({ success: true });
    } catch (error) {
        logger.error('Set entity value error:', error);
        res.status(500).json({ error: 'Failed to set entity value' });
    }
});

// Get map markers
router.get('/map/markers', authenticate, async (req, res) => {
    try {
        const markers = await rustService.getMapMarkers();
        res.json(markers);
    } catch (error) {
        logger.error('Map markers error:', error);
        res.status(500).json({ error: 'Failed to get map markers' });
    }
});

// Send team message
router.post('/team/message', authenticate, async (req, res) => {
    try {
        const { message } = req.body;
        await rustService.sendTeamMessage(message);
        res.json({ success: true });
    } catch (error) {
        logger.error('Team message error:', error);
        res.status(500).json({ error: 'Failed to send team message' });
    }
});

export default router; 