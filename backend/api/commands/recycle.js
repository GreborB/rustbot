const { io } = require('../../src/socketHandlers');

module.exports = async function recycleCommand(req, res) {
    const { item } = req.body;
    
    try {
        // Track command usage
        io.emit('commandUsed', 'recycle');
        
        // Code to get recycle information for the item
        const recycleInfo = await getRecycleInfo(item);
        res.send(`Recycling ${item} gives:\n${recycleInfo}`);
    } catch (error) {
        res.status(500).send('Error getting recycle information');
    }
};
