// Lazy load database to avoid circular dependency issues
function getDatabase() {
    const config = require('../config');
    const db = config.database;
    if (!db) {
        throw new Error('Database client not initialized. Check SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in .env file.');
    }
    return db;
}

const Category = {
    async create(data) {
        const database = getDatabase();
        const { data: category, error } = await database
            .from('categories')
            .insert([data])
            .select()
            .single();
        if (error) throw error;
        return category;
    },

    async findByUserId(userId, options = {}) {
        const database = getDatabase();
        const { limit = 10, offset = 0, sortBy = 'created_at', sortOrder = 'desc' } = options;
        let query = database
            .from('categories')
            .select('*')
            .eq('user_id', userId)
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + limit - 1);
        const { data: categories, error } = await query;
        if (error) throw error;
        return categories;
    },

    async findById(id) {
        const database = getDatabase();
        const { data: category, error } = await database
            .from('categories')
            .select('*')
            .eq('id', id)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return category;
    },

    async findByIdAndUserId(id, userId) {
        const database = getDatabase();
        const { data: category, error } = await database
            .from('categories')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return category;
    },

    async update(id, updates) {
        const database = getDatabase();
        const { data: category, error } = await database
            .from('categories')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return category;
    },

    async delete(id) {
        const database = getDatabase();
        const { error } = await database
            .from('categories')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }
};

module.exports = Category;
