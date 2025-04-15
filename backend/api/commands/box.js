module.exports = async function boxCommand(req, res) {
    const boxName = req.body.boxName;
    const item = req.body.item;
    // Code to fetch the amount of item in the specific box
    res.send(`Amount of ${item} in ${boxName} is: 100`);
};
