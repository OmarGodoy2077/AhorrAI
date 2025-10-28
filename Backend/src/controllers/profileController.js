const { Profile } = require('../models');

const ProfileController = {
    async getProfile(req, res) {
        try {
            const profile = await Profile.findById(req.user.userId);
            if (!profile) return res.status(404).json({ error: 'Profile not found' });
            res.json(profile);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async updateProfile(req, res) {
        try {
            const updates = req.body;
            const profile = await Profile.update(req.user.userId, updates);
            res.json(profile);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async deleteProfile(req, res) {
        try {
            await Profile.delete(req.user.userId);
            res.json({ message: 'Profile deleted' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = ProfileController;