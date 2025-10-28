const config = require('../config');
const database = config.database;

if (!database) {
    throw new Error('Database client not initialized. Check SUPABASE configuration.');
}

const Loan = {
    async create(data) {
        const { data: loan, error } = await database
            .from('loans')
            .insert([data])
            .select()
            .single();
        if (error) throw error;
        return loan;
    },

    async findByUserId(userId, options = {}) {
        const { limit = 10, offset = 0, sortBy = 'created_at', sortOrder = 'desc' } = options;
        let query = database
            .from('loans')
            .select('*')
            .eq('user_id', userId)
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + limit - 1);
        const { data: loans, error } = await query;
        if (error) throw error;
        return loans;
    },

    async findById(id) {
        const { data: loan, error } = await database
            .from('loans')
            .select('*')
            .eq('id', id)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return loan;
    },

    async update(id, updates) {
        const { data: loan, error } = await database
            .from('loans')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return loan;
    },

    async delete(id) {
        const { error } = await database
            .from('loans')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }
};

module.exports = Loan;
