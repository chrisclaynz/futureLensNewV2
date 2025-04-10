// Test setup file
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { beforeAll } = require('@jest/globals');

// Load environment variables
dotenv.config();

// Initialize Supabase client for tests with service role key
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
    {
        db: {
            schema: 'public'
        }
    }
);

// Function to enable RLS
async function enableRLS() {
    try {
        const { error } = await supabase.rpc('enable_rls');
        if (error) {
            console.error('Failed to enable RLS:', error);
            throw error;
        }
    } catch (err) {
        console.error('Error in enableRLS:', err);
        throw err;
    }
}

// Function to disable RLS
async function disableRLS() {
    try {
        const { error } = await supabase.rpc('disable_rls');
        if (error) {
            console.error('Failed to disable RLS:', error);
            throw error;
        }
    } catch (err) {
        console.error('Error in disableRLS:', err);
        throw err;
    }
}

// Disable RLS for tests by default
beforeAll(async () => {
    await disableRLS();
});

// Make supabase client and RLS functions available globally for tests
global.supabase = supabase;
global.enableRLS = enableRLS;
global.disableRLS = disableRLS;

module.exports = { supabase, enableRLS, disableRLS }; 