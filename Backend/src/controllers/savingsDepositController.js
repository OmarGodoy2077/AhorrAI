const { SavingsDeposit, SavingsGoal, FinancialSetting } = require('../models');

const SavingsDepositController = {
    async createDeposit(req, res) {
        try {
            const { goal_id, amount, deposit_date, description } = req.body;

            // Validate required fields
            if (!goal_id || !amount) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: [
                        { field: 'goal_id', message: 'Goal ID is required' },
                        { field: 'amount', message: 'Amount is required' }
                    ]
                });
            }

            // Validate amount is positive
            if (amount <= 0) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: [{ field: 'amount', message: 'Amount must be a positive number' }]
                });
            }

            // Verify the goal exists and belongs to the user
            const goal = await SavingsGoal.findById(goal_id);
            if (!goal || goal.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Savings goal not found' });
            }

            // Create the deposit
            const data = {
                goal_id,
                user_id: req.user.userId,
                amount,
                deposit_date: deposit_date || new Date().toISOString().split('T')[0],
                description: description || null
            };

            const deposit = await SavingsDeposit.create(data);
            res.status(201).json(deposit);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getDepositsByGoal(req, res) {
        try {
            const { page = 1, limit = 20, sortBy = 'deposit_date', sortOrder = 'desc' } = req.query;
            const offset = (page - 1) * limit;

            // Verify the goal exists and belongs to the user
            const goal = await SavingsGoal.findById(req.params.goalId);
            if (!goal || goal.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Savings goal not found' });
            }

            const deposits = await SavingsDeposit.findByGoalId(req.params.goalId, {
                limit: parseInt(limit),
                offset: parseInt(offset),
                sortBy,
                sortOrder
            });

            res.json({ data: deposits, page: parseInt(page), limit: parseInt(limit) });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getDeposits(req, res) {
        try {
            const { page = 1, limit = 20, sortBy = 'deposit_date', sortOrder = 'desc' } = req.query;
            const offset = (page - 1) * limit;

            const deposits = await SavingsDeposit.findByUserId(req.user.userId, {
                limit: parseInt(limit),
                offset: parseInt(offset),
                sortBy,
                sortOrder
            });

            res.json({ data: deposits, page: parseInt(page), limit: parseInt(limit) });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getDeposit(req, res) {
        try {
            const deposit = await SavingsDeposit.findById(req.params.id);
            if (!deposit || deposit.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Deposit not found' });
            }
            res.json(deposit);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async updateDeposit(req, res) {
        try {
            const deposit = await SavingsDeposit.findById(req.params.id);
            if (!deposit || deposit.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Deposit not found' });
            }

            // Validate amount if provided
            if (req.body.amount && req.body.amount <= 0) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: [{ field: 'amount', message: 'Amount must be a positive number' }]
                });
            }

            const updatedDeposit = await SavingsDeposit.update(req.params.id, req.body);
            res.json(updatedDeposit);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async deleteDeposit(req, res) {
        try {
            const deposit = await SavingsDeposit.findById(req.params.id);
            if (!deposit || deposit.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Deposit not found' });
            }

            await SavingsDeposit.delete(req.params.id);
            res.json({ message: 'Deposit deleted' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Get monthly savings status (compare actual vs target)
    async getMonthlySavingsStatus(req, res) {
        try {
            const { year, month } = req.params;
            const yearInt = parseInt(year);
            const monthInt = parseInt(month);

            // Validate year and month
            if (isNaN(yearInt) || isNaN(monthInt) || monthInt < 1 || monthInt > 12) {
                return res.status(400).json({ error: 'Invalid year or month format' });
            }

            // Get the current active financial setting for the user
            const { data: settings, error: settingsError } = await require('../config').database
                .from('financial_settings')
                .select('*')
                .eq('user_id', req.user.userId)
                .is('end_date', null)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

            const monthlySavingsTarget = settings?.monthly_savings_target || 0;

            // Get the monthly savings goal for this user
            const { data: monthlyGoal, error: goalError } = await require('../config').database
                .from('savings_goals')
                .select('*')
                .eq('user_id', req.user.userId)
                .eq('is_monthly_target', true)
                .single();

            if (goalError && goalError.code !== 'PGRST116') throw goalError;

            let actualDeposited = 0;
            if (monthlyGoal) {
                actualDeposited = await SavingsDeposit.getMonthlySavingsForMonth(
                    req.user.userId,
                    monthlyGoal.id,
                    yearInt,
                    monthInt
                );
            }

            const status = {
                year: yearInt,
                month: monthInt,
                target: monthlySavingsTarget,
                actual: actualDeposited,
                achieved: actualDeposited >= monthlySavingsTarget,
                difference: monthlySavingsTarget - actualDeposited,
                percentage: monthlySavingsTarget > 0 ? Math.round((actualDeposited / monthlySavingsTarget) * 100) : 0
            };

            res.json(status);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = SavingsDepositController;
