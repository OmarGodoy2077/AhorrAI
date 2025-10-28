const { SavingsGoal } = require('../models');

const SavingsGoalController = {
    async createGoal(req, res) {
        try {
            const { name, target_amount, goal_type, target_date, is_monthly_target } = req.body;

            // Validate required fields
            if (!name || !target_amount) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: [
                        { field: 'name', message: 'Goal name is required' },
                        { field: 'target_amount', message: 'Target amount is required' }
                    ]
                });
            }

            // Validate target_amount is positive
            if (target_amount <= 0) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: [{ field: 'target_amount', message: 'Target amount must be positive' }]
                });
            }

            // If setting as monthly target, verify no other monthly target exists
            if (is_monthly_target) {
                const existingMonthly = await SavingsGoal.findMonthlyTarget(req.user.userId);
                if (existingMonthly) {
                    return res.status(400).json({
                        error: 'User already has a monthly savings target. Update or delete the existing one.'
                    });
                }
            }

            const data = {
                user_id: req.user.userId,
                name,
                target_amount,
                goal_type: goal_type || 'custom',
                target_date: target_date || null,
                is_monthly_target: is_monthly_target || false
            };

            const goal = await SavingsGoal.create(data);
            res.status(201).json(goal);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getGoals(req, res) {
        try {
            const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
            const offset = (page - 1) * limit;
            const goals = await SavingsGoal.findByUserId(req.user.userId, {
                limit: parseInt(limit),
                offset: parseInt(offset),
                sortBy,
                sortOrder
            });
            res.json({ data: goals, page: parseInt(page), limit: parseInt(limit) });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getGoal(req, res) {
        try {
            const goal = await SavingsGoal.findById(req.params.id);
            if (!goal || goal.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Goal not found' });
            }
            res.json(goal);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async updateGoal(req, res) {
        try {
            const goal = await SavingsGoal.findById(req.params.id);
            if (!goal || goal.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Goal not found' });
            }

            // If trying to set as monthly target, verify no other monthly target exists
            if (req.body.is_monthly_target === true && !goal.is_monthly_target) {
                const existingMonthly = await SavingsGoal.findMonthlyTarget(req.user.userId);
                if (existingMonthly) {
                    return res.status(400).json({
                        error: 'User already has a monthly savings target. Update or delete the existing one.'
                    });
                }
            }

            const updatedGoal = await SavingsGoal.update(req.params.id, req.body);
            res.json(updatedGoal);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async deleteGoal(req, res) {
        try {
            const goal = await SavingsGoal.findById(req.params.id);
            if (!goal || goal.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Goal not found' });
            }
            await SavingsGoal.delete(req.params.id);
            res.json({ message: 'Goal deleted' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async setMonthlyTarget(req, res) {
        try {
            const goal = await SavingsGoal.findById(req.params.id);
            if (!goal || goal.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Goal not found' });
            }

            // Verify goal is of type 'monthly'
            if (goal.goal_type !== 'monthly') {
                return res.status(400).json({
                    error: 'Only goals of type "monthly" can be set as monthly target'
                });
            }

            // First, unset all monthly targets for the user
            await SavingsGoal.unsetMonthlyTarget(req.user.userId);

            // Then, set the selected one as monthly target
            const updatedGoal = await SavingsGoal.update(req.params.id, { is_monthly_target: true });
            res.json(updatedGoal);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Deprecated: kept for backward compatibility, redirects to deposit endpoint
    async depositToGoal(req, res) {
        try {
            return res.status(410).json({
                error: 'This endpoint is deprecated. Use POST /api/savings-deposits instead to create a deposit and the deposit will be tracked automatically.'
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Mark a goal as custom (excluded from global accumulation)
    async setAsCustomGoal(req, res) {
        try {
            const goal = await SavingsGoal.findById(req.params.id);
            if (!goal || goal.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Goal not found' });
            }

            // Prevent marking monthly or global goals as custom excluded
            if (goal.goal_type === 'global' || goal.is_monthly_target) {
                return res.status(400).json({
                    error: 'Cannot mark monthly or global goals as excluded from global accumulation'
                });
            }

            const updatedGoal = await SavingsGoal.setAsCustomExcluded(req.params.id);
            res.json(updatedGoal);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Mark a goal to contribute to global accumulation
    async setAsGlobalContributor(req, res) {
        try {
            const goal = await SavingsGoal.findById(req.params.id);
            if (!goal || goal.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Goal not found' });
            }

            const updatedGoal = await SavingsGoal.setAsCustomIncluded(req.params.id);
            res.json(updatedGoal);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Get all custom goals (excluded from global)
    async getCustomGoals(req, res) {
        try {
            const goals = await SavingsGoal.findCustomGoals(req.user.userId);
            res.json({ data: goals });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Get all goals that contribute to global
    async getGlobalContributors(req, res) {
        try {
            const goals = await SavingsGoal.findGoalsContributingToGlobal(req.user.userId);
            res.json({ data: goals });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = SavingsGoalController;