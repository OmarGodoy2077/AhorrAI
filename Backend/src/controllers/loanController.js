const { Loan } = require('../models');

const LoanController = {
    async createLoan(req, res) {
        try {
            const data = { ...req.body, user_id: req.user.userId };
            const loan = await Loan.create(data);
            res.status(201).json(loan);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getLoans(req, res) {
        try {
            const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
            const offset = (page - 1) * limit;
            const loans = await Loan.findByUserId(req.user.userId, {
                limit: parseInt(limit),
                offset: parseInt(offset),
                sortBy,
                sortOrder
            });
            res.json({ data: loans, page: parseInt(page), limit: parseInt(limit) });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getLoan(req, res) {
        try {
            const loan = await Loan.findById(req.params.id);
            if (!loan || loan.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Loan not found' });
            }
            res.json(loan);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async updateLoan(req, res) {
        try {
            const loan = await Loan.findById(req.params.id);
            if (!loan || loan.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Loan not found' });
            }
            const updatedLoan = await Loan.update(req.params.id, req.body);
            res.json(updatedLoan);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async deleteLoan(req, res) {
        try {
            const loan = await Loan.findById(req.params.id);
            if (!loan || loan.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Loan not found' });
            }
            await Loan.delete(req.params.id);
            res.json({ message: 'Loan deleted' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = LoanController;