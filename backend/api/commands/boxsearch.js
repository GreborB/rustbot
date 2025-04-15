module.exports = async function boxSearchCommand(req, res) {
    const item = req.body.item;
    // Code to search boxes containing the specific item
    res.send(`Boxes containing ${item}: Box1, Box2`);
};
