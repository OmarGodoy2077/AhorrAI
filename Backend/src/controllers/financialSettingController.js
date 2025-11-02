const { FinancialSetting } = require('../models');

const FinancialSettingController = {
    async createSetting(req, res) {
        try {
            const { effective_date, is_current, ...otherData } = req.body;
            const data = {
                ...otherData,
                user_id: req.user.userId,
                start_date: effective_date || new Date().toISOString().split('T')[0]
            };
            const setting = await FinancialSetting.create(data);
            // Map database fields to API response
            const response = {
                ...setting,
                effective_date: setting.start_date,
                is_current: !setting.end_date
            };
            res.status(201).json(response);
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
            // Map database fields to API response
            const mappedSettings = settings.map(setting => ({
                ...setting,
                effective_date: setting.start_date,
                is_current: !setting.end_date
            }));
            res.json({ data: mappedSettings, page: parseInt(page), limit: parseInt(limit) });
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
            // Map database fields to API response
            const response = {
                ...setting,
                effective_date: setting.start_date,
                is_current: !setting.end_date
            };
            res.json(response);
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
            const { effective_date, is_current, ...updateData } = req.body;
            const data = {
                ...updateData,
                ...(effective_date && { start_date: effective_date })
            };
            const updatedSetting = await FinancialSetting.update(id, data);
            // Map database fields to API response
            const response = {
                ...updatedSetting,
                effective_date: updatedSetting.start_date,
                is_current: !updatedSetting.end_date
            };
            res.json(response);
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