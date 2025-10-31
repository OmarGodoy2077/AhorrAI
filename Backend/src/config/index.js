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
    // CORS allowed origins (comma-separated list)
    allowedOrigins: process.env.ALLOWED_ORIGINS ?
        process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim()) :
        ['http://localhost:5173', 'https://pleasing-fulfillment-production.up.railway.app'],
    // Supabase auth client (for authentication operations)
    supabaseAuth: dbConfig.auth
};