const config = require('../config');
const database = config.database;

if (!database) {
    throw new Error('Database client not initialized. Check SUPABASE configuration.');
}

const Expense = {
    async create(data) {
        const { data: expense, error } = await database
            .from('expenses')
            .insert([data])
            .select()
            .single();
        if (error) throw error;
        return expense;
    },

    async findByUserId(userId, options = {}) {
        const { limit = 10, offset = 0, sortBy = 'date', sortOrder = 'desc' } = options;
        let query = database
            .from('expenses')
            .select(`
                *,
                categories (name, type)
            `)
            .eq('user_id', userId)
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + limit - 1);
        const { data: expenses, error } = await query;
        if (error) throw error;
        return expenses;
    },

    async findById(id) {
        const { data: expense, error } = await database
            .from('expenses')
            .select(`
                *,
                categories (name, type)
            `)
            .eq('id', id)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return expense;
    },

    async update(id, updates) {
        const { data: expense, error } = await database
            .from('expenses')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return expense;
    },

    async delete(id) {
        const { error } = await database
            .from('expenses')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }
};

module.exports = Expense;
