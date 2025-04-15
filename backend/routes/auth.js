const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(400).send('Invalid credentials');
    }

    const token = jwt.sign({ userId: user._id }, 'secret_key');
    res.send({ token });
});

module.exports = router;
