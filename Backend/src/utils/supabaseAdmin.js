const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Admin client for direct SQL queries and admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    },
    db: {
        schema: 'public'
    }
});

// Utility function to execute SQL queries directly
async function executeSql(query, params = []) {
    try {
        console.log('Executing SQL:', query, 'with params:', params);
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', params[0])
            .maybeSingle();

        if (error) {
            console.error('SQL execution error:', error);
            throw error;
        }

        return data || null;
    } catch (err) {
        console.error('Failed to execute SQL:', err);
        throw err;
    }
}

module.exports = {
    supabaseAdmin,
    executeSql
};