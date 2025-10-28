const config = require('../config');
const database = config.database;

if (!database) {
    throw new Error('Database client not initialized. Check SUPABASE configuration.');
}

const SpendingLimit = {
    async create(data) {
        const { data: limit, error } = await database
            .from('spending_limits')
            .insert([data])
            .select()
            .single();
        if (error) throw error;
        return limit;
    },

    async findByUserId(userId, options = {}) {
        const { limit = 10, offset = 0, sortBy = 'year', sortOrder = 'desc' } = options;
        let query = database
            .from('spending_limits')
            .select('*')
            .eq('user_id', userId)
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + limit - 1);
        const { data: limits, error } = await query;
        if (error) throw error;
        return limits;
    },

    async findByUserIdYearMonth(userId, year, month) {
        const { data: limit, error } = await database
            .from('spending_limits')
            .select('*')
            .eq('user_id', userId)
            .eq('year', year)
            .eq('month', month)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return limit;
    },

    async findById(id) {
        const { data: limit, error } = await database
            .from('spending_limits')
            .select('*')
            .eq('id', id)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return limit;
    },

    async update(id, updates) {
        const { data: limit, error } = await database
            .from('spending_limits')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return limit;
    },

    async delete(id) {
        const { error } = await database
            .from('spending_limits')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }
};

module.exports = SpendingLimit;

