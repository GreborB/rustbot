module.exports = async function boxCommand(req, res) {
    const { boxName, item } = req.body;
    
    try {
        // Code to fetch the amount of item in the specific box
        const amount = await getBoxItemAmount(boxName, item);
        res.send(`Amount of ${item} in ${boxName} is: ${amount}`);
    } catch (error) {
        res.status(500).send('Error checking box contents');
    }
};
