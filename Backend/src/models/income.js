const config = require('../config');
const database = config.database;

if (!database) {
    throw new Error('Database client not initialized. Check SUPABASE configuration.');
}

const Income = {
    async create(data) {
        const { data: income, error } = await database
            .from('income_sources')
            .insert([data])
            .select()
            .single();
        if (error) throw error;
        return income;
    },

    async findByUserId(userId, options = {}) {
        const { limit = 10, offset = 0, sortBy = 'created_at', sortOrder = 'desc' } = options;
        let query = database
            .from('income_sources')
            .select('*')
            .eq('user_id', userId)
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + limit - 1);
        const { data: incomes, error } = await query;
        if (error) throw error;
        return incomes;
    },

    async findById(id) {
        const { data: income, error } = await database
            .from('income_sources')
            .select('*')
            .eq('id', id)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return income;
    },

    async update(id, updates) {
        const { data: income, error } = await database
            .from('income_sources')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return income;
    },

    async delete(id) {
        const { error } = await database
            .from('income_sources')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    async confirm(id) {
        const { data: income, error } = await database
            .from('income_sources')
            .update({ is_confirmed: true, confirmed_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return income;
    }
};

module.exports = Income;
