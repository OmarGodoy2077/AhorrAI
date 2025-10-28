const { Income } = require('../models');

const IncomeController = {
    async createIncome(req, res) {
        try {
            const data = { ...req.body, user_id: req.user.userId };
            const income = await Income.create(data);
            res.status(201).json(income);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getIncomes(req, res) {
        try {
            const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
            const offset = (page - 1) * limit;
            const incomes = await Income.findByUserId(req.user.userId, { limit: parseInt(limit), offset: parseInt(offset), sortBy, sortOrder });
            res.json({ data: incomes, page: parseInt(page), limit: parseInt(limit) });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getIncome(req, res) {
        try {
            const income = await Income.findById(req.params.id);
            if (!income || income.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Income not found' });
            }
            res.json(income);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async updateIncome(req, res) {
        try {
            const income = await Income.findById(req.params.id);
            if (!income || income.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Income not found' });
            }
            const updatedIncome = await Income.update(req.params.id, req.body);
            res.json(updatedIncome);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async deleteIncome(req, res) {
        try {
            const income = await Income.findById(req.params.id);
            if (!income || income.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Income not found' });
            }
            await Income.delete(req.params.id);
            res.json({ message: 'Income deleted' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async confirmIncome(req, res) {
        try {
            const income = await Income.findById(req.params.id);
            if (!income || income.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Income not found' });
            }
            const confirmedIncome = await Income.confirm(req.params.id);
            res.json(confirmedIncome);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = IncomeController;