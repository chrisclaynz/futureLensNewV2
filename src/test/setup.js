// Test setup file
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create chainable mock functions
const createChainableMock = (returnValue = null) => {
    const mock = jest.fn().mockReturnThis();
    mock.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: returnValue, error: null }),
        insert: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis()
    }));
    return mock;
};

// Mock Supabase client
const mockSupabase = {
    from: createChainableMock(),
    rpc: jest.fn().mockResolvedValue({ error: null }),
    auth: {
        getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null })
    }
};

// Initialize Supabase client for tests
const supabase = createClient(
    process.env.VITE_SUPABASE_URL || 'https://test.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'test-key',
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

// Make supabase client and RLS functions available globally for tests
global.supabase = mockSupabase;
global.enableRLS = enableRLS;
global.disableRLS = disableRLS;

// Mock the supabaseClient module
jest.mock('../supabaseClient', () => ({
    supabase: mockSupabase
}));

module.exports = { supabase: mockSupabase, enableRLS, disableRLS }; 