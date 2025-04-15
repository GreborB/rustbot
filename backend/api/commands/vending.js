module.exports = async function vendingCommand(req, res) {
    const itemName = req.body.itemName;
    // Code to fetch vending machine data
    res.send(`Vending machine at location A1 is selling High Quality Metal for 100 scrap.`);
};
