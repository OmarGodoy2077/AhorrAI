const config = require('../config');
const database = config.database;

if (!database) {
    throw new Error('Database client not initialized. Check SUPABASE configuration.');
}

const FinancialSetting = {
    async create(data) {
        const { data: setting, error } = await database
            .from('financial_settings')
            .insert([data])
            .select()
            .single();
        if (error) throw error;
        return setting;
    },

    async findByUserId(userId, options = {}) {
        const { limit = 10, offset = 0, sortBy = 'created_at', sortOrder = 'desc' } = options;
        let query = database
            .from('financial_settings')
            .select('*')
            .eq('user_id', userId)
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + limit - 1);
        const { data: settings, error } = await query;
        if (error) throw error;
        return settings;
    },

    async findCurrentByUserId(userId) {
        const { data: setting, error } = await database
            .from('financial_settings')
            .select('*')
            .eq('user_id', userId)
            .is('end_date', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return setting;
    },

    async findById(id) {
        const { data: setting, error } = await database
            .from('financial_settings')
            .select('*')
            .eq('id', id)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return setting;
    },

    async update(id, updates) {
        const { data: setting, error } = await database
            .from('financial_settings')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return setting;
    },

    async delete(id) {
        const { error } = await database
            .from('financial_settings')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }
};

module.exports = FinancialSetting;
