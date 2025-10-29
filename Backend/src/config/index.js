require('dotenv').config();

const dbConfig = require('./database');

module.exports = {
    // Supabase database client directly
    database: dbConfig.database,
    // Auth configuration for JWT
    auth: require('./auth'),
    // Cloudinary configuration
    cloudinary: require('./cloudinary'),
    // Server configuration
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    timezone: process.env.TZ || 'America/Guatemala',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    // Supabase auth client (for authentication operations)
    supabaseAuth: dbConfig.auth
};