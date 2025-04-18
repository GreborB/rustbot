module.exports = async function vendingCommand(req, res) {
    const { itemName, action } = req.body;
    
    try {
        if (action === 'search') {
            // Code to search vending machines for an item
            const machines = await searchVendingMachines(itemName);
            if (machines.length === 0) {
                res.send(`No vending machines found selling ${itemName}`);
            } else {
                res.send(
                    `Vending machines selling ${itemName}:\n` +
                    machines.map(m => 
                        `- Location: ${m.location}\n` +
                        `  Price: ${m.price} ${m.currency}\n` +
                        `  Stock: ${m.stock}`
                    ).join('\n')
                );
            }
        } else if (action === 'list') {
            // Code to list all vending machines
            const machines = await getAllVendingMachines();
            res.send(
                'All vending machines:\n' +
                machines.map(m => `- ${m.location}: ${m.items.length} items`).join('\n')
            );
        } else {
            res.status(400).send('Invalid action. Use "search" or "list"');
        }
    } catch (error) {
        res.status(500).send('Error processing vending command');
    }
};
