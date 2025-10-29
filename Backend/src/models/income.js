// Lazy load database to avoid circular dependency issues
function getDatabase() {
    const config = require('../config');
    const db = config.database;
    if (!db) {
        throw new Error('Database client not initialized. Check SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in .env file.');
    }
    return db;
}

const Income = {
    async create(data) {
        const database = getDatabase();
        const { data: income, error } = await database
            .from('income_sources')
            .insert([data])
            .select(`
                *,
                currencies (code, name, symbol)
            `)
            .single();
        if (error) throw error;
        return income;
    },

    async findByUserId(userId, options = {}) {
        const database = getDatabase();
        const { limit = 10, offset = 0, sortBy = 'created_at', sortOrder = 'desc' } = options;
        let query = database
            .from('income_sources')
            .select(`
                *,
                currencies (code, name, symbol)
            `)
            .eq('user_id', userId)
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + limit - 1);
        const { data: incomes, error } = await query;
        if (error) throw error;

        // Get total count
        const { count, error: countError } = await database
            .from('income_sources')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
        if (countError) throw countError;

        return { data: incomes, total: count };
    },

    async findById(id) {
        const database = getDatabase();
        const { data: income, error } = await database
            .from('income_sources')
            .select(`
                *,
                currencies (code, name, symbol)
            `)
            .eq('id', id)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return income;
    },

    async update(id, updates) {
        const database = getDatabase();
        const { data: income, error } = await database
            .from('income_sources')
            .update(updates)
            .eq('id', id)
            .select(`
                *,
                currencies (code, name, symbol)
            `)
            .single();
        if (error) throw error;
        return income;
    },

    async delete(id) {
        const database = getDatabase();
        const { error } = await database
            .from('income_sources')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    async confirm(id) {
        const database = getDatabase();
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
