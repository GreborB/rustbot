const express = require('express');
const router = express.Router();
const boxCommand = require('../api/commands/box');
const boxSearchCommand = require('../api/commands/boxsearch');

router.post('/box', boxCommand);
router.post('/boxsearch', boxSearchCommand);

module.exports = router;
