const express = require('express');
const { SavingsGoalController } = require('../controllers');
const { authenticate, validateSavingsGoal } = require('../middleware');

const router = express.Router();

router.post('/', authenticate, validateSavingsGoal, SavingsGoalController.createGoal);
router.get('/', authenticate, SavingsGoalController.getGoals);
router.get('/:id', authenticate, SavingsGoalController.getGoal);
router.put('/:id', authenticate, validateSavingsGoal, SavingsGoalController.updateGoal);
router.delete('/:id', authenticate, SavingsGoalController.deleteGoal);

// Monthly target management
router.post('/:id/set-monthly-target', authenticate, SavingsGoalController.setMonthlyTarget);

// Custom vs Global accumulation management
router.post('/:id/exclude-from-global', authenticate, SavingsGoalController.setAsCustomGoal);
router.post('/:id/include-in-global', authenticate, SavingsGoalController.setAsGlobalContributor);

// Get custom and global contributor goals
router.get('/goals/custom', authenticate, SavingsGoalController.getCustomGoals);
router.get('/goals/global-contributors', authenticate, SavingsGoalController.getGlobalContributors);

// Deprecated endpoint (kept for compatibility, returns error)
router.post('/:id/deposit', authenticate, SavingsGoalController.depositToGoal);

module.exports = router;