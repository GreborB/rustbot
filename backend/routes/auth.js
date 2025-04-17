const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = User.findByUsername(username);

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(400).send('Invalid credentials');
    }

    const token = jwt.sign({ username: user.username }, 'secret_key');
    res.send({ token });
});

router.post('/register', (req, res) => {
    const { username, password } = req.body;
    
    if (User.findByUsername(username)) {
        return res.status(400).send('Username already exists');
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = User.create(username, hashedPassword);
    
    const token = jwt.sign({ username: user.username }, 'secret_key');
    res.send({ token });
});

module.exports = router;
