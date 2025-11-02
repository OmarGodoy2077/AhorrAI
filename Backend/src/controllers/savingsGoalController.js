const { SavingsGoal } = require('../models');

// Lazy load database to avoid circular dependency issues
function getDatabase() {
    const config = require('../config');
    const db = config.database;
    if (!db) {
        throw new Error('Database client not initialized. Check SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in .env file.');
    }
    return db;
}

const SavingsGoalController = {
    async createGoal(req, res) {
        try {
            const { name, target_amount, goal_type, target_date, is_monthly_target, currency } = req.body;

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

            // For custom goals, verify the virtual account was created by the trigger
            // If not, create it manually (fallback)
            if (goal_type === 'custom' || goal.goal_type === 'custom') {
                // Refresh the goal to get the virtual_account_id set by the trigger
                const refreshedGoal = await SavingsGoal.findById(goal.id);
                
                if (!refreshedGoal.virtual_account_id) {
                    // Trigger didn't work, create manually
                    try {
                        const database = getDatabase();
                        // Get USD currency ID as fallback
                        let currencyId = currency;
                        if (!currencyId) {
                            const { data: usdCurrency } = await database
                                .from('currencies')
                                .select('id')
                                .eq('code', 'USD')
                                .single();
                            currencyId = usdCurrency?.id || null;
                        }
                        
                        const { data: virtualAccountId, error } = await database
                            .rpc('create_virtual_account_for_goal', {
                                p_goal_id: goal.id,
                                p_user_id: req.user.userId,
                                p_goal_name: name,
                                p_currency_id: currencyId
                            });

                        if (error) {
                            console.error('Error creating virtual account for goal:', error);
                            return res.status(500).json({ 
                                error: 'No se pudo crear la cuenta virtual para la meta. Por favor intente nuevamente.' 
                            });
                        }
                        
                        // Refresh goal again to get updated virtual_account_id
                        const finalGoal = await SavingsGoal.findById(goal.id);
                        return res.status(201).json(finalGoal);
                    } catch (virtualAccountError) {
                        console.error('Failed to create virtual account:', virtualAccountError);
                        return res.status(500).json({ 
                            error: 'No se pudo crear la cuenta virtual para la meta. Por favor intente nuevamente.' 
                        });
                    }
                }
                
                res.status(201).json(refreshedGoal);
            } else {
                res.status(201).json(goal);
            }
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

            // If this is a custom goal with a virtual account, delete the virtual account first
            if (goal.virtual_account_id && goal.goal_type === 'custom') {
                const { Account } = require('../models');
                await Account.delete(goal.virtual_account_id);
            }

            await SavingsGoal.delete(req.params.id);
            res.json({ message: 'Goal deleted successfully' });
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
    },

    // Update monthly and global goals with calculated amounts
    async updateCalculatedGoals(req, res) {
        try {
            const database = getDatabase();
            const userId = req.user.userId;
            const now = new Date();
            const currentMonth = now.getMonth() + 1;
            const currentYear = now.getFullYear();

            // Get monthly summary for current month
            const { data: monthlySummary } = await database
                .from('monthly_summaries')
                .select('total_income, total_expenses, net_change')
                .eq('user_id', userId)
                .eq('year', currentYear)
                .eq('month', currentMonth)
                .single();

            // Get yearly summary for total accumulated savings
            const { data: yearlySummaries } = await database
                .from('yearly_summaries')
                .select('net_change')
                .eq('user_id', userId);

            const totalAccumulated = yearlySummaries 
                ? yearlySummaries.reduce((sum, year) => sum + (parseFloat(year.net_change) || 0), 0)
                : 0;

            const monthlySavings = monthlySummary ? (parseFloat(monthlySummary.net_change) || 0) : 0;

            // Update monthly goal current_amount
            await database
                .from('savings_goals')
                .update({ 
                    current_amount: monthlySavings,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId)
                .eq('goal_type', 'monthly');

            // Update global goal current_amount
            await database
                .from('savings_goals')
                .update({ 
                    current_amount: totalAccumulated,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId)
                .eq('goal_type', 'global');

            res.json({ 
                message: 'Goals updated successfully',
                monthly: monthlySavings,
                global: totalAccumulated
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = SavingsGoalController;