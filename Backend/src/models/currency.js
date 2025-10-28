const config = require('../config');
const database = config.database;

if (!database) {
    throw new Error('Database client not initialized. Check SUPABASE configuration.');
}

const Currency = {
    async findAll() {
        const { data: currencies, error } = await database
            .from('currencies')
            .select('*');
        if (error) throw error;
        return currencies;
    },

    async findByCode(code) {
        const { data: currency, error } = await database
            .from('currencies')
            .select('*')
            .eq('code', code)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return currency;
    }
};

module.exports = Currency;
