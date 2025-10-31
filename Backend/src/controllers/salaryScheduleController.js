const { SalarySchedule } = require('../models');

const SalaryScheduleController = {
    async createSalarySchedule(req, res) {
        try {
            const data = { ...req.body, user_id: req.user.userId };
            if (data.account_id === '') {
                data.account_id = null;
            }
            if (data.currency_id === '') {
                data.currency_id = null;
            }

            // Calculate next_generation_date based on frequency, salary_day, and start_date (only for fixed salaries)
            let nextGenerationDate = null;

            if (data.type === 'fixed' && data.frequency && data.start_date && data.salary_day !== undefined) {
                const startDate = new Date(data.start_date);
                const now = new Date();

                if (data.frequency === 'monthly') {
                    // For monthly, find the next occurrence of salary_day starting from start_date
                    const salaryDay = data.salary_day;

                    // Start from the start_date month/year
                    let targetDate = new Date(startDate.getFullYear(), startDate.getMonth(), salaryDay);

                    // If the salary day is before the start date in that month, move to next month
                    if (targetDate < startDate) {
                        targetDate.setMonth(targetDate.getMonth() + 1);
                    }

                    // Always use the calculated date from start_date, regardless of whether it's in the past or future
                    nextGenerationDate = targetDate.toISOString().split('T')[0];
                } else if (data.frequency === 'weekly') {
                    // For weekly, salary_day represents day of week (0-6, Sunday=0)
                    // Start from start_date and find the next occurrence of that day of week
                    const startDayOfWeek = startDate.getDay();
                    const targetDayOfWeek = data.salary_day;

                    let daysToAdd = (targetDayOfWeek - startDayOfWeek + 7) % 7;
                    if (daysToAdd === 0) daysToAdd = 7; // If it's the same day, move to next week

                    let targetDate = new Date(startDate);
                    targetDate.setDate(startDate.getDate() + daysToAdd);

                    // Always use the calculated date from start_date
                    nextGenerationDate = targetDate.toISOString().split('T')[0];
                }
            }

            data.next_generation_date = nextGenerationDate;
            data.is_active = data.is_active !== undefined ? data.is_active : true;

            const salarySchedule = await SalarySchedule.create(data);
            res.status(201).json(salarySchedule);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getSalarySchedules(req, res) {
        try {
            const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
            const offset = (page - 1) * limit;
            const result = await SalarySchedule.findByUserId(req.user.userId, { limit: parseInt(limit), offset: parseInt(offset), sortBy, sortOrder });
            res.json({ data: result.data, page: parseInt(page), limit: parseInt(limit), total: result.total });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getSalarySchedule(req, res) {
        try {
            const salarySchedule = await SalarySchedule.findById(req.params.id);
            if (!salarySchedule || salarySchedule.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Salary schedule not found' });
            }
            res.json(salarySchedule);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async updateSalarySchedule(req, res) {
        try {
            const salarySchedule = await SalarySchedule.findById(req.params.id);
            if (!salarySchedule || salarySchedule.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Salary schedule not found' });
            }
            const updates = { ...req.body };
            if (updates.account_id === '') {
                updates.account_id = null;
            }
            if (updates.currency_id === '') {
                updates.currency_id = null;
            }

            // Recalculate next_generation_date if frequency or salary_day changed
            if (updates.frequency || updates.salary_day || updates.start_date) {
                const currentData = { ...salarySchedule, ...updates };
                const now = new Date();
                const startDate = new Date(currentData.start_date);
                let nextGenerationDate;

                if (currentData.frequency === 'monthly') {
                    // For monthly, find the next occurrence of salary_day starting from start_date
                    const salaryDay = currentData.salary_day;
                    
                    // Start from the start_date month/year
                    let targetDate = new Date(startDate.getFullYear(), startDate.getMonth(), salaryDay);
                    
                    // If the salary day is before the start date in that month, move to next month
                    if (targetDate < startDate) {
                        targetDate.setMonth(targetDate.getMonth() + 1);
                    }
                    
                    // Always use the calculated date from start_date
                    nextGenerationDate = targetDate.toISOString().split('T')[0];
                } else if (currentData.frequency === 'weekly') {
                    // For weekly, salary_day represents day of week (0-6, Sunday=0)
                    // Start from start_date and find the next occurrence of that day of week
                    const startDayOfWeek = startDate.getDay();
                    const targetDayOfWeek = currentData.salary_day;
                    
                    let daysToAdd = (targetDayOfWeek - startDayOfWeek + 7) % 7;
                    if (daysToAdd === 0) daysToAdd = 7; // If it's the same day, move to next week
                    
                    let targetDate = new Date(startDate);
                    targetDate.setDate(startDate.getDate() + daysToAdd);
                    
                    // Always use the calculated date from start_date
                    nextGenerationDate = targetDate.toISOString().split('T')[0];
                }

                updates.next_generation_date = nextGenerationDate;
            }

            const updatedSalarySchedule = await SalarySchedule.update(req.params.id, updates);
            res.json(updatedSalarySchedule);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async deleteSalarySchedule(req, res) {
        try {
            const salarySchedule = await SalarySchedule.findById(req.params.id);
            if (!salarySchedule || salarySchedule.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Salary schedule not found' });
            }
            await SalarySchedule.delete(req.params.id);
            res.json({ message: 'Salary schedule deleted' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async toggleSalarySchedule(req, res) {
        try {
            const salarySchedule = await SalarySchedule.findById(req.params.id);
            if (!salarySchedule || salarySchedule.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Salary schedule not found' });
            }

            const updates = { is_active: req.body.is_active };
            const updatedSalarySchedule = await SalarySchedule.update(req.params.id, updates);
            res.json(updatedSalarySchedule);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = SalaryScheduleController;