const express = require('express');
const { IncomeController } = require('../controllers');
const { authenticate, validateIncome } = require('../middleware');

const router = express.Router();

// Specific routes BEFORE parameterized routes
router.post('/generate/salary-incomes', authenticate, IncomeController.generateSalaryIncomes);
router.get('/confirmation/period', authenticate, IncomeController.getSalaryConfirmationPeriod);
router.post('/confirmation/create', authenticate, IncomeController.createSalaryConfirmation);

// CRUD routes
router.post('/', authenticate, validateIncome, IncomeController.createIncome);
router.get('/', authenticate, IncomeController.getIncomes);
router.get('/:id', authenticate, IncomeController.getIncome);
router.put('/:id', authenticate, validateIncome, IncomeController.updateIncome);
router.delete('/:id', authenticate, IncomeController.deleteIncome);
router.post('/:id/confirm', authenticate, IncomeController.confirmIncome);

module.exports = router;