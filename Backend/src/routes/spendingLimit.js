const express = require('express');
const { SpendingLimitController } = require('../controllers');
const { authenticate, validateSpendingLimit } = require('../middleware');

const router = express.Router();

// Specific routes MUST come before general parameterized routes
router.post('/', authenticate, validateSpendingLimit, SpendingLimitController.createLimit);
router.get('/', authenticate, SpendingLimitController.getLimits);
router.get('/:year/:month/status', authenticate, SpendingLimitController.checkSpendingStatus);
router.get('/:year/:month', authenticate, SpendingLimitController.getLimitByYearMonth);
router.get('/:id', authenticate, SpendingLimitController.getLimit);
router.put('/:id', authenticate, validateSpendingLimit, SpendingLimitController.updateLimit);
router.delete('/:id', authenticate, SpendingLimitController.deleteLimit);

module.exports = router;
