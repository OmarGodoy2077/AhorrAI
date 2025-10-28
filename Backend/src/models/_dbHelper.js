// Lazy load database to avoid circular dependency issues
function getDatabase() {
    const config = require('../config');
    const db = config.database;
    if (!db) {
        throw new Error('Database client not initialized. Check SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in .env file.');
    }
    return db;
}
