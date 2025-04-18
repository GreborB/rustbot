module.exports = async function upkeepCommand(req, res) {
    const { tcName, action } = req.body;
    
    try {
        if (action === 'check') {
            // Code to check tool cupboard upkeep
            const { timeRemaining, resources } = await getToolCupboardUpkeep(tcName);
            res.send(
                `Tool cupboard "${tcName}" upkeep:\n` +
                `Time remaining: ${timeRemaining} hours\n` +
                `Required resources:\n` +
                resources.map(r => `- ${r.amount} ${r.item}`).join('\n')
            );
        } else if (action === 'list') {
            // Code to list all tool cupboards
            const tcs = await getAllToolCupboards();
            res.send(
                'All tool cupboards:\n' +
                tcs.map(tc => `- ${tc.name}: ${tc.timeRemaining} hours remaining`).join('\n')
            );
        } else {
            res.status(400).send('Invalid action. Use "check" or "list"');
        }
    } catch (error) {
        res.status(500).send('Error processing upkeep command');
    }
};
