// Lazy load database to avoid circular dependency issues
function getDatabase() {
    const config = require('../config');
    const db = config.database;
    if (!db) {
        throw new Error('Database client not initialized. Check SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in .env file.');
    }
    return db;
}

const SavingsGoal = {
    async create(data) {
        const database = getDatabase();
        const { data: goal, error } = await database
            .from('savings_goals')
            .insert([data])
            .select()
            .single();
        if (error) throw error;
        return goal;
    },

    async findByUserId(userId, options = {}) {
        const { limit = 10, offset = 0, sortBy = 'created_at', sortOrder = 'desc' } = options;
        const database = getDatabase();
        let query = database
            .from('savings_goals')
            .select('*')
            .eq('user_id', userId)
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + limit - 1);
        const { data: goals, error } = await query;
        if (error) throw error;
        return goals;
    },

    async findById(id) {
        const database = getDatabase();
        const { data: goal, error } = await database
            .from('savings_goals')
            .select('*')
            .eq('id', id)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return goal;
    },

    async update(id, updates) {
        const database = getDatabase();
        const { data: goal, error } = await database
            .from('savings_goals')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return goal;
    },

    async delete(id) {
        const database = getDatabase();
        const { error } = await database
            .from('savings_goals')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    async setPrimary(userId, goalId) {
        const database = getDatabase();
        // First, unset all primary for the user
        await database
            .from('savings_goals')
            .update({ is_primary: false })
            .eq('user_id', userId);
        // Then, set the selected one as primary
        const { data: goal, error } = await database
            .from('savings_goals')
            .update({ is_primary: true })
            .eq('id', goalId)
            .eq('user_id', userId)
            .select()
            .single();
        if (error) throw error;
        return goal;
    },

    async findMonthlyTarget(userId) {
        const database = getDatabase();
        const { data: goal, error } = await database
            .from('savings_goals')
            .select('*')
            .eq('user_id', userId)
            .eq('is_monthly_target', true)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return goal;
    },

    async unsetMonthlyTarget(userId) {
        const database = getDatabase();
        const { error } = await database
            .from('savings_goals')
            .update({ is_monthly_target: false })
            .eq('user_id', userId);
        if (error) throw error;
        return true;
    },

    async setAsCustomExcluded(goalId) {
        const database = getDatabase();
        const { data: goal, error } = await database
            .from('savings_goals')
            .update({ is_custom_excluded_from_global: true })
            .eq('id', goalId)
            .select()
            .single();
        if (error) throw error;
        return goal;
    },

    async setAsCustomIncluded(goalId) {
        const database = getDatabase();
        const { data: goal, error } = await database
            .from('savings_goals')
            .update({ is_custom_excluded_from_global: false })
            .eq('id', goalId)
            .select()
            .single();
        if (error) throw error;
        return goal;
    },

    // Get all custom goals (excluded from global)
    async findCustomGoals(userId) {
        const database = getDatabase();
        const { data: goals, error } = await database
            .from('savings_goals')
            .select('*')
            .eq('user_id', userId)
            .eq('is_custom_excluded_from_global', true)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return goals;
    },

    // Get all goals that contribute to global
    async findGoalsContributingToGlobal(userId) {
        const database = getDatabase();
        const { data: goals, error } = await database
            .from('savings_goals')
            .select('*')
            .eq('user_id', userId)
            .eq('is_custom_excluded_from_global', false)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return goals;
    }
};

module.exports = SavingsGoal;
