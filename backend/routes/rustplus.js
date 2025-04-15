const express = require('express');
const pairManager = require('../rustplus/pairManager');
const router = express.Router();

router.post('/pair', pairManager.pairServer);

module.exports = router;
