// Lazy load database to avoid circular dependency issues
function getDatabase() {
    const config = require('../config');
    const db = config.database;
    if (!db) {
        throw new Error('Database client not initialized. Check SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in .env file.');
    }
    return db;
}

const Account = {
    async create(data) {
        const database = getDatabase();
        const { data: account, error } = await database
            .from('accounts')
            .insert([data])
            .select()
            .single();
        if (error) throw error;
        return account;
    },

    async findByUserId(userId, options = {}) {
        const database = getDatabase();
        const { limit = 10, offset = 0, sortBy = 'created_at', sortOrder = 'desc' } = options;
        let query = database
            .from('accounts')
            .select('*')
            .eq('user_id', userId)
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + limit - 1);
        const { data: accounts, error } = await query;
        if (error) throw error;
        return accounts;
    },

    async findById(id) {
        const database = getDatabase();
        const { data: account, error } = await database
            .from('accounts')
            .select('*')
            .eq('id', id)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return account;
    },

    async update(id, updates) {
        const database = getDatabase();
        const { data: account, error } = await database
            .from('accounts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return account;
    },

    async delete(id) {
        const database = getDatabase();
        const { error } = await database
            .from('accounts')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }
};

module.exports = Account;