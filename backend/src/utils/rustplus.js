const crypto = require('crypto');

// Generate a random session token
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Validate a Rust+ pairing code
async function validatePairingCode(code) {
  try {
    // TODO: Implement actual Rust+ protocol validation
    // For now, just validate the format
    return /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code);
  } catch (error) {
    console.error('Pairing code validation error:', error);
    return false;
  }
}

// Get server info for pairing
async function getServerInfo() {
  try {
    // TODO: Implement actual Rust+ protocol server info retrieval
    return {
      name: 'Rust Server',
      ip: process.env.RUST_SERVER_IP,
      port: process.env.RUST_SERVER_PORT,
      status: 'online'
    };
  } catch (error) {
    console.error('Server info retrieval error:', error);
    return null;
  }
}

module.exports = {
  generateSessionToken,
  validatePairingCode,
  getServerInfo
}; 