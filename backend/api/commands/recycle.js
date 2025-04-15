module.exports = async function recycleCommand(req, res) {
    const boxName = req.body.boxName;
    // Code to calculate recycled materials based on what's in the box
    res.send(`Box ${boxName} will recycle into 50 metal frags.`);
};
