const express = require('express');
const { ExpenseController } = require('../controllers');
const { authenticate, validateExpense } = require('../middleware');

const router = express.Router();

router.post('/', authenticate, validateExpense, ExpenseController.createExpense);
router.get('/', authenticate, ExpenseController.getExpenses);
router.get('/:id', authenticate, ExpenseController.getExpense);
router.put('/:id', authenticate, validateExpense, ExpenseController.updateExpense);
router.delete('/:id', authenticate, ExpenseController.deleteExpense);

module.exports = router;