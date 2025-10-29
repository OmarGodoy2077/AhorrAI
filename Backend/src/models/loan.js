// Lazy load database to avoid circular dependency issues
function getDatabase() {
    const config = require('../config');
    const db = config.database;
    if (!db) {
        throw new Error('Database client not initialized. Check SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in .env file.');
    }
    return db;
}

const Loan = {
    async create(data) {
        const database = getDatabase();
        const { data: loan, error } = await database
            .from('loans')
            .insert([data])
            .select()
            .single();
        if (error) throw error;
        return loan;
    },

    async findByUserId(userId, options = {}) {
        const database = getDatabase();
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
        const database = getDatabase();
        const { data: loan, error } = await database
            .from('loans')
            .select('*')
            .eq('id', id)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return loan;
    },

    async update(id, updates) {
        const database = getDatabase();
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
        const database = getDatabase();
        const { error } = await database
            .from('loans')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }
};

module.exports = Loan;
