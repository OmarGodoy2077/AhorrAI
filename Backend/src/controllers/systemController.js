const { getTodayGuatemalaString, formatDateTime } = require('../utils/dateUtils');

const SystemController = {
    async getCurrentDateTime(req, res) {
        try {
            const todayStr = getTodayGuatemalaString();
            const now = new Date();
            
            res.json({
                date: todayStr,
                timestamp: now.toISOString(),
                timezone: 'America/Guatemala',
                message: 'Current server date/time in Guatemala timezone'
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = SystemController;
