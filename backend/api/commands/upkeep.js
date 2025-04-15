module.exports = async function upkeepCommand(req, res) {
    const tcName = req.body.tcName;
    // Code to calculate time remaining for upkeep
    res.send(`Tool cupboard ${tcName} has 12 hours of upkeep remaining.`);
};
