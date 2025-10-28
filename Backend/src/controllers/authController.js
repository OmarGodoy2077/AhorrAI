const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const supabaseAuthClient = config.supabaseAuth;
const { Profile } = require('../models');

const AuthController = {
    async register(req, res) {
        try {
            const { email, password, fullName } = req.body;

            // Validate input
            if (!email || !password || !fullName) {
                return res.status(400).json({ 
                    error: 'Email, password, and fullName are required' 
                });
            }

            // Sign up with Supabase Auth
            if (!supabaseAuthClient) {
                return res.status(500).json({ 
                    error: 'Auth client not configured on server' 
                });
            }

            // Sign up with user metadata - profile will be auto-created via trigger
            const { data: authData, error: authError } = await supabaseAuthClient.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName
                    }
                }
            });
            
            // Handle Supabase auth errors with proper error codes
            if (authError) {
                console.error('Supabase auth error:', authError);
                
                // Specific error handling
                if (authError.code === 'user_already_exists' || authError.message.includes('already registered')) {
                    return res.status(409).json({ 
                        error: 'This email is already registered. Please use login instead or try with a different email.',
                        code: 'USER_ALREADY_EXISTS'
                    });
                }
                
                if (authError.code === 'email_address_invalid' || authError.message.includes('invalid')) {
                    return res.status(400).json({ 
                        error: 'Invalid email address. Please provide a valid email.',
                        code: 'INVALID_EMAIL'
                    });
                }
                
                // Generic error
                throw authError;
            }

            // Check if user was created
            if (!authData.user) {
                return res.status(400).json({ 
                    error: 'Registration failed. Please try again.',
                    code: 'REGISTRATION_FAILED'
                });
            }

            const userId = authData.user.id;

            // Wait a moment for the database trigger to create the profile
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Fetch the profile (should be created by the database trigger)
            let profile = await Profile.findById(userId);

            // If profile still doesn't exist (rare case), log a warning
            if (!profile) {
                console.warn(`⚠️ Profile not found for user ${userId} after trigger should have created it`);
            }

            // Generate JWT
            const token = jwt.sign(
                { userId, email }, 
                config.auth.secret, 
                { expiresIn: config.auth.expiresIn }
            );

            res.status(201).json({ 
                message: 'User registered successfully. Please check your email to verify your account.',
                token, 
                user: profile,
                requiresEmailVerification: true
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ 
                error: error.message || 'Registration failed. Please try again.',
                code: 'REGISTRATION_ERROR'
            });
        }
    },

    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Validate input
            if (!email || !password) {
                return res.status(400).json({ 
                    error: 'Email and password are required' 
                });
            }

            // Sign in with Supabase Auth
            if (!supabaseAuthClient) {
                return res.status(500).json({ 
                    error: 'Auth client not configured on server' 
                });
            }

            const { data: authData, error: authError } = await supabaseAuthClient.auth.signInWithPassword({
                email,
                password
            });
            
            if (authError) {
                console.error('Login error:', authError);
                
                // Specific error handling
                if (authError.code === 'invalid_grant' || authError.message.includes('Invalid login credentials')) {
                    return res.status(401).json({ 
                        error: 'Invalid email or password',
                        code: 'INVALID_CREDENTIALS'
                    });
                }
                
                throw authError;
            }

            const userId = authData.user.id;
            
            // Check if email is verified (optional based on your requirements)
            const isEmailConfirmed = authData.user.email_confirmed_at;
            
            if (!isEmailConfirmed) {
                console.warn(`User ${email} logged in but email not confirmed`);
            }

            // Get profile with retries (should exist from database trigger during signup)
            let profile = null;
            let retries = 3;
            
            while (retries > 0 && !profile) {
                profile = await Profile.findById(userId);
                if (!profile) {
                    console.warn(`⚠️ Profile not found for user ${userId}. Retries left: ${retries-1}`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    retries--;
                }
            }

            // If profile still doesn't exist after retries, log error
            if (!profile) {
                console.error(`❌ Profile not found for user ${userId} after ${3-retries} retries.`);
            }

            // Generate JWT
            const token = jwt.sign(
                { userId, email: authData.user.email }, 
                config.auth.secret, 
                { expiresIn: config.auth.expiresIn }
            );

            res.json({ 
                message: 'Login successful', 
                token, 
                user: profile,
                emailConfirmed: !!isEmailConfirmed
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(401).json({ 
                error: error.message || 'Login failed. Please try again.',
                code: 'LOGIN_ERROR'
            });
        }
    }
};

module.exports = AuthController;