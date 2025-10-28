const { Expense } = require('../models');

const ExpenseController = {
    async createExpense(req, res) {
        try {
            const data = { ...req.body, user_id: req.user.userId };
            const expense = await Expense.create(data);
            res.status(201).json(expense);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getExpenses(req, res) {
        try {
            const { page = 1, limit = 10, sortBy = 'date', sortOrder = 'desc' } = req.query;
            const offset = (page - 1) * limit;
            const expenses = await Expense.findByUserId(req.user.userId, { limit: parseInt(limit), offset: parseInt(offset), sortBy, sortOrder });
            res.json({ data: expenses, page: parseInt(page), limit: parseInt(limit) });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getExpense(req, res) {
        try {
            const expense = await Expense.findById(req.params.id);
            if (!expense || expense.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Expense not found' });
            }
            res.json(expense);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async updateExpense(req, res) {
        try {
            const expense = await Expense.findById(req.params.id);
            if (!expense || expense.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Expense not found' });
            }
            const updatedExpense = await Expense.update(req.params.id, req.body);
            res.json(updatedExpense);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async deleteExpense(req, res) {
        try {
            const expense = await Expense.findById(req.params.id);
            if (!expense || expense.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Expense not found' });
            }
            await Expense.delete(req.params.id);
            res.json({ message: 'Expense deleted' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = ExpenseController;