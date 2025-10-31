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
        
        // Validate income data
        if (!data.user_id) throw new Error('user_id is required');
        if (!data.name) throw new Error('name is required');
        if (!data.amount || parseFloat(data.amount) <= 0) throw new Error('amount must be greater than 0');
        if (!data.type || !['fixed', 'variable', 'extra'].includes(data.type)) {
            throw new Error('type must be "fixed", "variable", or "extra"');
        }
        
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

    async findByUserIdAndType(userId, type) {
        const database = getDatabase();
        const { data: incomes, error } = await database
            .from('income_sources')
            .select(`
                *,
                currencies (code, name, symbol)
            `)
            .eq('user_id', userId)
            .eq('type', type);
        if (error) throw error;
        return incomes;
    },

    async findActiveByUserIdAndType(userId, type) {
        const database = getDatabase();
        const { data: incomes, error } = await database
            .from('income_sources')
            .select(`
                *,
                currencies (code, name, symbol)
            `)
            .eq('user_id', userId)
            .eq('type', type)
            .eq('is_confirmed', false);
        if (error) throw error;
        return incomes;
    },

    async update(id, updates) {
        const database = getDatabase();
        
        // Validate updates
        if (updates.amount && parseFloat(updates.amount) <= 0) {
            throw new Error('amount must be greater than 0');
        }
        if (updates.type && !['fixed', 'variable', 'extra'].includes(updates.type)) {
            throw new Error('type must be "fixed", "variable", or "extra"');
        }
        
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
        
        // Allow deletion of any income - validation is now handled in the controller
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
    },

    async calculateAverageIncome(userId, periodDays = 30) {
        const database = getDatabase();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - periodDays);
        const startDateStr = startDate.toISOString().split('T')[0];

        const { data: incomes, error } = await database
            .from('income_sources')
            .select('amount')
            .eq('user_id', userId)
            .in('type', ['variable', 'extra'])
            .gte('income_date', startDateStr);

        if (error) throw error;

        if (!incomes || incomes.length === 0) return 0;

        const total = incomes.reduce((sum, inc) => sum + (parseFloat(inc.amount) || 0), 0);
        return (total / periodDays) * 30; // Normalize to monthly average
    },

    async getIncomesByPeriod(userId, startDate, endDate) {
        const database = getDatabase();
        const { data: incomes, error } = await database
            .from('income_sources')
            .select(`
                *,
                currencies (code, name, symbol)
            `)
            .eq('user_id', userId)
            .gte('income_date', startDate)
            .lte('income_date', endDate);

        if (error) throw error;
        return incomes;
    }
};

module.exports = Income;
