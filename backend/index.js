const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const commandsRoutes = require('./routes/commands');
const rustPlusRoutes = require('./routes/rustplus');

const app = express();
app.use(bodyParser.json());
app.use('/auth', authRoutes);
app.use('/commands', commandsRoutes);
app.use('/rustplus', rustPlusRoutes);

mongoose.connect('mongodb://localhost/kinabot_db', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log(err));

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
