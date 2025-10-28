const { FinancialSetting } = require('../models');

const FinancialSettingController = {
    async createSetting(req, res) {
        try {
            const data = { ...req.body, user_id: req.user.userId };
            const setting = await FinancialSetting.create(data);
            res.status(201).json(setting);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getSettings(req, res) {
        try {
            const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
            const offset = (page - 1) * limit;
            const settings = await FinancialSetting.findByUserId(req.user.userId, {
                limit: parseInt(limit),
                offset: parseInt(offset),
                sortBy,
                sortOrder
            });
            res.json({ data: settings, page: parseInt(page), limit: parseInt(limit) });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getCurrentSetting(req, res) {
        try {
            const setting = await FinancialSetting.findCurrentByUserId(req.user.userId);
            if (!setting) {
                return res.status(404).json({ error: 'No active financial setting found' });
            }
            res.json(setting);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async updateSetting(req, res) {
        try {
            const { id } = req.params;
            const setting = await FinancialSetting.findById(id);
            if (!setting || setting.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Setting not found' });
            }
            const updatedSetting = await FinancialSetting.update(id, req.body);
            res.json(updatedSetting);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async deleteSetting(req, res) {
        try {
            const { id } = req.params;
            const setting = await FinancialSetting.findById(id);
            if (!setting || setting.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Setting not found' });
            }
            await FinancialSetting.delete(id);
            res.json({ message: 'Setting deleted' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = FinancialSettingController;