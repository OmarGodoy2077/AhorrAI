const { Account } = require('../models');

const AccountController = {
    async createAccount(req, res) {
        try {
            const data = { ...req.body, user_id: req.user.userId };
            const account = await Account.create(data);
            res.status(201).json(account);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getAccounts(req, res) {
        try {
            const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
            const offset = (page - 1) * limit;
            const accounts = await Account.findByUserId(req.user.userId, {
                limit: parseInt(limit),
                offset: parseInt(offset),
                sortBy,
                sortOrder
            });
            res.json({ data: accounts, page: parseInt(page), limit: parseInt(limit) });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getAccount(req, res) {
        try {
            const account = await Account.findById(req.params.id);
            if (!account || account.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Account not found' });
            }
            res.json(account);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async updateAccount(req, res) {
        try {
            const account = await Account.findById(req.params.id);
            if (!account || account.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Account not found' });
            }
            const updatedAccount = await Account.update(req.params.id, req.body);
            res.json(updatedAccount);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async deleteAccount(req, res) {
        try {
            const account = await Account.findById(req.params.id);
            if (!account || account.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Account not found' });
            }
            await Account.delete(req.params.id);
            res.json({ message: 'Account deleted' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = AccountController;