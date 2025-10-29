// Lazy load database to avoid circular dependency issues
function getDatabase() {
    const config = require('../config');
    const db = config.database;
    if (!db) {
        throw new Error('Database client not initialized. Check SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in .env file.');
    }
    return db;
}

const Expense = {
    async create(data) {
        const database = getDatabase();
        const { data: expense, error } = await database
            .from('expenses')
            .insert([data])
            .select(`
                *,
                categories (name, type),
                currencies (code, name, symbol)
            `)
            .single();
        if (error) throw error;
        // Map date to expense_date for frontend compatibility
        if (expense.date) {
            expense.expense_date = expense.date;
            delete expense.date;
        }
        return expense;
    },

    async findByUserId(userId, options = {}) {
        const database = getDatabase();
        const { limit = 10, offset = 0, sortBy = 'date', sortOrder = 'desc' } = options;
        let query = database
            .from('expenses')
            .select(`
                *,
                categories (name, type),
                currencies (code, name, symbol)
            `)
            .eq('user_id', userId)
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + limit - 1);
        const { data: expenses, error } = await query;
        if (error) throw error;
        // Map date to expense_date for frontend compatibility
        return expenses.map(expense => {
            if (expense.date) {
                expense.expense_date = expense.date;
                delete expense.date;
            }
            return expense;
        });
    },

    async findById(id) {
        const database = getDatabase();
        const { data: expense, error } = await database
            .from('expenses')
            .select(`
                *,
                categories (name, type),
                currencies (code, name, symbol)
            `)
            .eq('id', id)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        // Map date to expense_date for frontend compatibility
        if (expense && expense.date) {
            expense.expense_date = expense.date;
            delete expense.date;
        }
        return expense;
    },

    async update(id, updates) {
        const database = getDatabase();
        const { data: expense, error } = await database
            .from('expenses')
            .update(updates)
            .eq('id', id)
            .select(`
                *,
                categories (name, type),
                currencies (code, name, symbol)
            `)
            .single();
        if (error) throw error;
        // Map date to expense_date for frontend compatibility
        if (expense.date) {
            expense.expense_date = expense.date;
            delete expense.date;
        }
        return expense;
    },

    async delete(id) {
        const database = getDatabase();
        const { error } = await database
            .from('expenses')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }
};

module.exports = Expense;
