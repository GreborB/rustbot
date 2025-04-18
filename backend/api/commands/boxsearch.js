module.exports = async function boxSearchCommand(req, res) {
    const { item } = req.body;
    
    try {
        // Code to search boxes containing the specific item
        const boxes = await searchBoxesForItem(item);
        if (boxes.length === 0) {
            res.send(`No boxes found containing ${item}`);
        } else {
            res.send(
                `Boxes containing ${item}:\n` +
                boxes.map(box => `- ${box.name}: ${box.amount} ${item}`).join('\n')
            );
        }
    } catch (error) {
        res.status(500).send('Error searching boxes');
    }
};
