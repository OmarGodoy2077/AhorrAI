const express = require('express');
const { SavingsDepositController } = require('../controllers');
const { authenticate } = require('../middleware');

const router = express.Router();

// Create a new deposit
router.post('/', authenticate, SavingsDepositController.createDeposit);

// Get all deposits for the user
router.get('/', authenticate, SavingsDepositController.getDeposits);

// Get a specific deposit
router.get('/:id', authenticate, SavingsDepositController.getDeposit);

// Get deposits for a specific goal
router.get('/goal/:goalId', authenticate, SavingsDepositController.getDepositsByGoal);

// Update a deposit
router.put('/:id', authenticate, SavingsDepositController.updateDeposit);

// Delete a deposit
router.delete('/:id', authenticate, SavingsDepositController.deleteDeposit);

// Get monthly savings status (compare target vs actual)
router.get('/monthly-status/:year/:month', authenticate, SavingsDepositController.getMonthlySavingsStatus);

module.exports = router;
