module.exports = async function playerCommand(req, res) {
    const playerName = req.body.playerName;
    // Code to track player's last online time
    res.send(`Last seen ${playerName} at 3:45 PM`);
};
