module.exports = async function timerCommand(req, res) {
    const { timerName, duration, action } = req.body;
    
    try {
        if (action === 'set') {
            // Code to set a new timer
            const timer = await setTimer(timerName, duration);
            res.send(`Timer "${timerName}" set for ${duration} minutes`);
        } else if (action === 'check') {
            // Code to check remaining time
            const remaining = await getTimerRemaining(timerName);
            res.send(`Timer "${timerName}" has ${remaining} minutes remaining`);
        } else if (action === 'list') {
            // Code to list all active timers
            const timers = await getAllTimers();
            if (timers.length === 0) {
                res.send('No active timers');
            } else {
                res.send(
                    'Active timers:\n' +
                    timers.map(t => `- ${t.name}: ${t.remaining} minutes remaining`).join('\n')
                );
            }
        } else {
            res.status(400).send('Invalid action. Use "set", "check", or "list"');
        }
    } catch (error) {
        res.status(500).send('Error processing timer command');
    }
};
