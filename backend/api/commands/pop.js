module.exports = async function popCommand(req, res) {
    try {
        // Code to fetch detailed player count information
        const { total, online, max, queue } = await getPlayerCount();
        res.send(
            `Players online: ${online}/${max}\n` +
            `Players in queue: ${queue}\n` +
            `Total unique players: ${total}`
        );
    } catch (error) {
        res.status(500).send('Error getting player count');
    }
};
