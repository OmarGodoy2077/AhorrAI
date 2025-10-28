const express = require('express');
const { CurrencyController } = require('../controllers');

const router = express.Router();

router.get('/', CurrencyController.getCurrencies);

module.exports = router;