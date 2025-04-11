import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Initialize the Supabase client
const supabaseUrl = 'https://ckuyhnaxxuthvgiuldnl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdXlobmF4eHV0aHZnaXVsZG5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyNDUxODksImV4cCI6MjA1OTgyMTE4OX0.63XBgwvtibXUKoLea_qW5a8dHqFSszFVmPmcEfNTkf8';

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey); 