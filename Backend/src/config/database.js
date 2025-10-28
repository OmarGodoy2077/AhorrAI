const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validation with better error messages
console.log('\n=== Supabase Configuration ===');
console.log('✓ Supabase URL:', supabaseUrl ? 'Loaded' : '✗ MISSING');
console.log('✓ Supabase Anon Key:', supabaseAnonKey ? 'Loaded' : '✗ MISSING');
console.log('✓ Supabase Service Role Key:', supabaseServiceKey ? 'Loaded' : '✗ MISSING');

const errors = [];

if (!supabaseUrl) {
    errors.push('SUPABASE_URL is not set');
}
if (!supabaseAnonKey) {
    errors.push('SUPABASE_ANON_KEY is not set');
}
if (!supabaseServiceKey) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is not set');
}

if (errors.length > 0) {
    console.error('\n❌ Supabase configuration errors:');
    errors.forEach(err => console.error(`  - ${err}`));
    throw new Error('Supabase is not properly configured. Please check your .env file.');
}

// Auth client for user authentication (uses anon key)
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

// Database client for CRUD operations (uses service role key to bypass RLS)
const supabaseDb = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    },
    global: {
        headers: {
            'X-Client-Info': 'AhorrAI-Backend',
        }
    }
});

console.log('✓ Supabase clients created successfully\n');

// Test database connection
supabaseDb.from('profiles').select('count').limit(1).then(({ data, error }) => {
    if (error) {
        console.error('❌ Supabase DB connection test failed:', error.message);
    } else {
        console.log('✓ Supabase DB connection test successful');
    }
});

module.exports = {
    auth: supabaseAuth,
    database: supabaseDb
};