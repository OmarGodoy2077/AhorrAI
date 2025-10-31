// Lazy load database to avoid circular dependency issues
function getDatabase() {
    const config = require('../config');
    const db = config.database;
    if (!db) {
        throw new Error('Database client not initialized. Check SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in .env file.');
    }
    return db;
}

const SalarySchedule = {
    async create(data) {
        const database = getDatabase();
        const { data: salarySchedule, error } = await database
            .from('salary_schedules')
            .insert([data])
            .select(`
                *,
                currencies (code, name, symbol),
                accounts (id, name, type)
            `)
            .single();
        if (error) throw error;
        return salarySchedule;
    },

    async findByUserId(userId, options = {}) {
        const database = getDatabase();
        const { limit = 10, offset = 0, sortBy = 'created_at', sortOrder = 'desc' } = options;
        let query = database
            .from('salary_schedules')
            .select(`
                *,
                currencies (code, name, symbol),
                accounts (id, name, type)
            `)
            .eq('user_id', userId)
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + limit - 1);
        const { data: salarySchedules, error } = await query;
        if (error) throw error;

        // Get total count
        const { count, error: countError } = await database
            .from('salary_schedules')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
        if (countError) throw countError;

        return { data: salarySchedules, total: count };
    },

    async findById(id) {
        const database = getDatabase();
        const { data: salarySchedule, error } = await database
            .from('salary_schedules')
            .select(`
                *,
                currencies (code, name, symbol),
                accounts (id, name, type)
            `)
            .eq('id', id)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return salarySchedule;
    },

    async update(id, updates) {
        const database = getDatabase();
        const { data: salarySchedule, error } = await database
            .from('salary_schedules')
            .update(updates)
            .eq('id', id)
            .select(`
                *,
                currencies (code, name, symbol),
                accounts (id, name, type)
            `)
            .single();
        if (error) throw error;
        return salarySchedule;
    },

    async delete(id) {
        const database = getDatabase();
        const { error } = await database
            .from('salary_schedules')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }
};

module.exports = SalarySchedule;