const express = require('express');
const router = express.Router();
const AccountStatementController = require('../controllers/accountStatementController');
const { authenticate } = require('../middleware');

/**
 * @route   GET /api/account-statements
 * @desc    Get account statement with transaction history
 * @access  Private
 * @query   year, month, account_id (optional)
 */
router.get('/', authenticate, AccountStatementController.getAccountStatement);

module.exports = router;
