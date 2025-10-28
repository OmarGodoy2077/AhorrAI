const config = require('../config');
const database = config.database;

if (!database) {
    throw new Error('Database client not initialized. Check SUPABASE configuration.');
}

const YearlySummary = {
    async create(data) {
        const { data: summary, error } = await database
            .from('yearly_summaries')
            .insert([data])
            .select()
            .single();
        if (error) throw error;
        return summary;
    },

    async findByUserIdAndYear(userId, year) {
        const { data: summary, error } = await database
            .from('yearly_summaries')
            .select('*')
            .eq('user_id', userId)
            .eq('year', year)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return summary;
    },

    async update(userId, year, updates) {
        const { data: summary, error } = await database
            .from('yearly_summaries')
            .update(updates)
            .eq('user_id', userId)
            .eq('year', year)
            .select()
            .single();
        if (error) throw error;
        return summary;
    }
};

module.exports = YearlySummary;