import { createClient } from '@supabase/supabase-js';

// In test environment, use mock values
const isTest = process.env.NODE_ENV === 'test';

const supabaseUrl = isTest 
    ? 'https://test.supabase.co'
    : import.meta.env.VITE_SUPABASE_URL;

const supabaseAnonKey = isTest
    ? 'test-anon-key'
    : import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!isTest && (!supabaseUrl || !supabaseAnonKey)) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 