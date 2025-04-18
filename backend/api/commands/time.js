module.exports = async function timeCommand(req, res) {
    try {
        // Code to get in-game time and day/night cycle
        const { currentTime, isDay, timeUntilChange } = await getGameTime();
        const cycle = isDay ? 'day' : 'night';
        const nextCycle = isDay ? 'night' : 'day';
        
        res.send(
            `Current time: ${currentTime}\n` +
            `It is currently ${cycle}.\n` +
            `${nextCycle} starts in ${timeUntilChange} minutes.`
        );
    } catch (error) {
        res.status(500).send('Error getting game time');
    }
};
