const { SpendingLimit, Expense } = require('../models');

const SpendingLimitController = {
    async createLimit(req, res) {
        try {
            const data = { ...req.body, user_id: req.user.userId };
            const limit = await SpendingLimit.create(data);
            res.status(201).json(limit);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getLimits(req, res) {
        try {
            const { page = 1, limit = 10, sortBy = 'year', sortOrder = 'desc' } = req.query;
            const offset = (page - 1) * limit;
            const limits = await SpendingLimit.findByUserId(req.user.userId, {
                limit: parseInt(limit),
                offset: parseInt(offset),
                sortBy,
                sortOrder
            });
            res.json({ data: limits, page: parseInt(page), limit: parseInt(limit) });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getLimitByYearMonth(req, res) {
        try {
            const { year, month } = req.params;
            const limit = await SpendingLimit.findByUserIdYearMonth(req.user.userId, parseInt(year), parseInt(month));
            if (!limit) {
                return res.status(404).json({ error: 'Spending limit not found' });
            }
            res.json(limit);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getLimit(req, res) {
        try {
            const limit = await SpendingLimit.findById(req.params.id);
            if (!limit || limit.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Spending limit not found' });
            }
            res.json(limit);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async updateLimit(req, res) {
        try {
            const limit = await SpendingLimit.findById(req.params.id);
            if (!limit || limit.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Spending limit not found' });
            }
            const updatedLimit = await SpendingLimit.update(req.params.id, req.body);
            res.json(updatedLimit);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async deleteLimit(req, res) {
        try {
            const limit = await SpendingLimit.findById(req.params.id);
            if (!limit || limit.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Spending limit not found' });
            }
            await SpendingLimit.delete(req.params.id);
            res.json({ message: 'Spending limit deleted' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async checkSpendingStatus(req, res) {
        try {
            const { year, month } = req.params;
            
            // Get the spending limit
            const limit = await SpendingLimit.findByUserIdYearMonth(req.user.userId, parseInt(year), parseInt(month));
            if (!limit) {
                return res.status(404).json({ error: 'Spending limit not found' });
            }

            // Calculate total expenses for the month (from all accounts, all currencies)
            const allExpenses = await Expense.findByUserId(req.user.userId);
            const monthExpenses = allExpenses.filter(e => {
                const expenseDate = new Date(e.date);
                return expenseDate.getFullYear() === parseInt(year) && 
                       expenseDate.getMonth() + 1 === parseInt(month);
            });

            const totalSpent = monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
            const remaining = limit.monthly_limit - totalSpent;
            const percentageUsed = (totalSpent / limit.monthly_limit) * 100;
            const isExceeded = totalSpent > limit.monthly_limit;

            res.json({
                limit: limit.monthly_limit,
                spent: totalSpent,
                remaining: remaining > 0 ? remaining : 0,
                percentageUsed: Math.min(percentageUsed, 100),
                isExceeded: isExceeded,
                warningLevel: percentageUsed >= 80 ? 'warning' : (percentageUsed >= 100 ? 'exceeded' : 'ok')
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = SpendingLimitController;
