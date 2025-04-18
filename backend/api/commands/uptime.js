const { io } = require('../../src/socketHandlers');

module.exports = async function uptimeCommand(req, res) {
    try {
        // Track command usage
        io.emit('commandUsed', 'uptime');
        
        // Code to get server uptime
        const uptime = await getServerUptime();
        res.send(`Server has been up for ${uptime}`);
    } catch (error) {
        res.status(500).send('Error getting server uptime');
    }
}; 