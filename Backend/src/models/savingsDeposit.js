const config = require('../config');
const database = config.database;

if (!database) {
    throw new Error('Database client not initialized. Check SUPABASE configuration.');
}

const SavingsDeposit = {
    async create(data) {
        const { data: deposit, error } = await database
            .from('savings_deposits')
            .insert([data])
            .select()
            .single();
        if (error) throw error;
        return deposit;
    },

    async findByGoalId(goalId, options = {}) {
        const { limit = 50, offset = 0, sortBy = 'deposit_date', sortOrder = 'desc' } = options;
        let query = database
            .from('savings_deposits')
            .select('*')
            .eq('goal_id', goalId)
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + limit - 1);
        const { data: deposits, error } = await query;
        if (error) throw error;
        return deposits;
    },

    async findByUserId(userId, options = {}) {
        const { limit = 50, offset = 0, sortBy = 'deposit_date', sortOrder = 'desc' } = options;
        let query = database
            .from('savings_deposits')
            .select('*')
            .eq('user_id', userId)
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + limit - 1);
        const { data: deposits, error } = await query;
        if (error) throw error;
        return deposits;
    },

    async findById(id) {
        const { data: deposit, error } = await database
            .from('savings_deposits')
            .select('*')
            .eq('id', id)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return deposit;
    },

    async update(id, updates) {
        const { data: deposit, error } = await database
            .from('savings_deposits')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return deposit;
    },

    async delete(id) {
        const { error } = await database
            .from('savings_deposits')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    // Get total deposited to a specific goal
    async getTotalByGoalId(goalId) {
        const { data, error } = await database
            .from('savings_deposits')
            .select('amount')
            .eq('goal_id', goalId);
        if (error) throw error;
        const total = data.reduce((sum, deposit) => sum + parseFloat(deposit.amount), 0);
        return total;
    },

    // Get deposits for a specific goal in a date range
    async getByGoalIdAndDateRange(goalId, startDate, endDate) {
        const { data: deposits, error } = await database
            .from('savings_deposits')
            .select('*')
            .eq('goal_id', goalId)
            .gte('deposit_date', startDate)
            .lte('deposit_date', endDate)
            .order('deposit_date', { ascending: false });
        if (error) throw error;
        return deposits;
    },

    // Get total deposited to monthly goal in a specific month
    async getMonthlySavingsForMonth(userId, monthlyGoalId, year, month) {
        const firstDay = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const lastDay = new Date(year, month, 0).toISOString().split('T')[0];

        const { data, error } = await database
            .from('savings_deposits')
            .select('amount')
            .eq('goal_id', monthlyGoalId)
            .eq('user_id', userId)
            .gte('deposit_date', firstDay)
            .lte('deposit_date', lastDay);

        if (error) throw error;
        const total = data.reduce((sum, deposit) => sum + parseFloat(deposit.amount), 0);
        return total;
    }
};

module.exports = SavingsDeposit;
