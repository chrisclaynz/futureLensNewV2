// Main application entry point
import { createClient } from '@supabase/supabase-js';
import { initAuth } from './auth.js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('FutureLens application initialized');
    initAuth();
}); 