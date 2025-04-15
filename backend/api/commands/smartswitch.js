module.exports = async function smartswitchCommand(req, res) {
    const switchName = req.body.switchName;
    const action = req.body.action; // "on" or "off"
    // Code to toggle smart switch on/off
    res.send(`${switchName} is now ${action}`);
};
