const { MonthlySummary, YearlySummary, Expense, Income } = require('../models');

const SummaryController = {
    async getMonthlySummary(req, res) {
        try {
            const { year, month } = req.params;
            const summary = await MonthlySummary.findByUserIdYearMonth(req.user.userId, parseInt(year), parseInt(month));
            res.json(summary);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getYearlySummary(req, res) {
        try {
            const { year } = req.params;
            const summary = await YearlySummary.findByUserIdAndYear(req.user.userId, parseInt(year));
            res.json(summary);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async generateMonthlySummary(req, res) {
        try {
            const { year, month } = req.body;
            // Calculate total income and expenses for the month
            const incomes = await Income.findByUserId(req.user.userId);
            const expenses = await Expense.findByUserId(req.user.userId);

            const totalIncome = incomes
                .filter(i => new Date(i.created_at).getFullYear() === year && new Date(i.created_at).getMonth() + 1 === month)
                .reduce((sum, i) => sum + parseFloat(i.amount), 0);

            const totalExpenses = expenses
                .filter(e => new Date(e.date).getFullYear() === year && new Date(e.date).getMonth() + 1 === month)
                .reduce((sum, e) => sum + parseFloat(e.amount), 0);

            const netChange = totalIncome - totalExpenses;

            const summary = await MonthlySummary.create({
                user_id: req.user.userId,
                year,
                month,
                total_income: totalIncome,
                total_expenses: totalExpenses,
                net_change: netChange
            });

            res.status(201).json(summary);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = SummaryController;