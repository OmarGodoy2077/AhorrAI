const express = require('express');
const { SystemController } = require('../controllers');

const router = express.Router();

router.get('/current-datetime', SystemController.getCurrentDateTime);

module.exports = router;
