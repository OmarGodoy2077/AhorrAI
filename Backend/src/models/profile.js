// Lazy load database to avoid circular dependency issues
function getDatabase() {
    const config = require('../config');
    const db = config.database;
    if (!db) {
        throw new Error('Database client not initialized. Check SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in .env file.');
    }
    return db;
}

const { executeSql } = require('../utils/supabaseAdmin');

const Profile = {
    async create(data, retries = 3, delay = 1000) {
        const database = getDatabase();
        let lastError = null;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`Attempting to create profile (attempt ${attempt}/${retries})`);
                
                const { data: profile, error } = await database
                    .from('profiles')
                    .insert([data])
                    .select()
                    .single();

                if (error) {
                    console.error(`Profile creation error (attempt ${attempt}/${retries}):`, error);
                    lastError = error;

                    // If it's a unique violation, we might already have the profile
                    if (error.code === '23505') {
                        const existingProfile = await this.findById(data.id);
                        if (existingProfile) {
                            console.log('Profile already exists, returning existing profile');
                            return existingProfile;
                        }
                    }

                    if (attempt < retries) {
                        console.log(`Waiting ${delay}ms before retry...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                    throw error;
                }

                console.log('Profile created successfully');
                return profile;
            } catch (err) {
                lastError = err;
                console.error(`Unexpected error in profile creation (attempt ${attempt}/${retries}):`, err);
                
                if (attempt < retries) {
                    console.log(`Waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
            }
        }

        throw lastError || new Error('Failed to create profile after all retries');
    },

    async findById(id, retries = 3, delay = 1000) {
        const database = getDatabase();
        let lastError = null;
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`Attempting to find profile ${id} (attempt ${attempt}/${retries})`);
                
                const { data: profile, error } = await database
                    .from('profiles')
                    .select('*')
                    .eq('id', id)
                    .maybeSingle();

                if (error) {
                    console.error(`Profile.findById error for ${id} (attempt ${attempt}/${retries}):`, error);
                    lastError = error;
                    
                    if (error.code !== 'PGRST116') {
                        throw error;
                    }
                    
                    if (attempt < retries) {
                        console.log(`Waiting ${delay}ms before retry...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                    break;
                }

                if (!profile) {
                    console.warn(`Profile not found for ${id} (attempt ${attempt}/${retries})`);

                    if (attempt < retries) {
                        console.log(`Waiting ${delay}ms before retry...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                    break;
                }

                console.log(`Profile found successfully for ${id}`);
                return profile;
            } catch (err) {
                lastError = err;
                console.error(`Unexpected error in Profile.findById for ${id} (attempt ${attempt}/${retries}):`, err);
                
                if (attempt < retries) {
                    console.log(`Waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
            }
        }

        // If we get here, all retries failed. Try SQL fallback
        try {
            console.log('Attempting direct SQL query as fallback...');
            const result = await executeSql(
                'SELECT * FROM profiles WHERE id = $1 LIMIT 1',
                [id]
            );

            if (result) {
                console.log('Profile found via direct SQL');
                return result;
            }
            
            console.warn(`No profile found for user ${id} after all attempts`);
            return null;
        } catch (sqlError) {
            console.error('SQL fallback also failed:', sqlError);
            throw lastError || sqlError;
        }
    },

    async update(id, updates) {
        const database = getDatabase();
        const { data: profile, error } = await database
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return profile;
    },

    async delete(id) {
        const database = getDatabase();
        const { error } = await database
            .from('profiles')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }
};

module.exports = Profile;