const config = require('../config');
const database = config.database;

if (!database) {
    throw new Error('Database client not initialized. Check SUPABASE configuration.');
}

const MonthlySummary = {
    async create(data) {
        const { data: summary, error } = await database
            .from('monthly_summaries')
            .insert([data])
            .select()
            .single();
        if (error) throw error;
        return summary;
    },

    async findByUserIdAndYear(userId, year) {
        const { data: summaries, error } = await database
            .from('monthly_summaries')
            .select('*')
            .eq('user_id', userId)
            .eq('year', year);
        if (error) throw error;
        return summaries;
    },

    async findByUserIdYearMonth(userId, year, month) {
        const { data: summary, error } = await database
            .from('monthly_summaries')
            .select('*')
            .eq('user_id', userId)
            .eq('year', year)
            .eq('month', month)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return summary;
    },

    async update(userId, year, month, updates) {
        const { data: summary, error } = await database
            .from('monthly_summaries')
            .update(updates)
            .eq('user_id', userId)
            .eq('year', year)
            .eq('month', month)
            .select()
            .single();
        if (error) throw error;
        return summary;
    }
};

module.exports = MonthlySummary;
