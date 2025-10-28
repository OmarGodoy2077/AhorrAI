const express = require('express');
const authRoutes = require('./auth');
const profileRoutes = require('./profile');
const financialSettingRoutes = require('./financialSetting');
const incomeRoutes = require('./income');
const expenseRoutes = require('./expense');
const accountRoutes = require('./account');
const categoryRoutes = require('./category');
const summaryRoutes = require('./summary');
const loanRoutes = require('./loan');
const currencyRoutes = require('./currency');
const savingsGoalRoutes = require('./savingsGoal');
const savingsDepositRoutes = require('./savingsDeposit');
const spendingLimitRoutes = require('./spendingLimit');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/financial-settings', financialSettingRoutes);
router.use('/incomes', incomeRoutes);
router.use('/expenses', expenseRoutes);
router.use('/accounts', accountRoutes);
router.use('/categories', categoryRoutes);
router.use('/summaries', summaryRoutes);
router.use('/loans', loanRoutes);
router.use('/currencies', currencyRoutes);
router.use('/savings-goals', savingsGoalRoutes);
router.use('/savings-deposits', savingsDepositRoutes);
router.use('/spending-limits', spendingLimitRoutes);

module.exports = router;