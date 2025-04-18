import express from 'express';
import { validatePairingCode } from '../utils/rustplus.js';
import { generateSessionToken } from '../utils/server.js';

const router = express.Router();

// Pair with server using Rust+ protocol
router.post('/pair', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Pairing code is required' 
      });
    }

    // Validate pairing code
    const isValid = await validatePairingCode(code);
    if (!isValid) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid pairing code' 
      });
    }

    // Generate session token
    const token = generateSessionToken();
    
    // Store session
    req.session.user = {
      token,
      pairedAt: new Date()
    };

    res.json({
      success: true,
      user: {
        token,
        pairedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Pairing error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to pair with server' 
    });
  }
});

// Check authentication status
router.get('/status', (req, res) => {
  if (req.session.user) {
    res.json({ 
      success: true, 
      user: req.session.user 
    });
  } else {
    res.status(401).json({ 
      success: false, 
      error: 'Not authenticated' 
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

export default router; 