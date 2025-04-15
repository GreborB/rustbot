module.exports = async function timerCommand(req, res) {
    const timerName = req.body.timerName;
    // Code to set a timer or fetch remaining time
    res.send(`Timer ${timerName} will expire in 10 minutes.`);
};
