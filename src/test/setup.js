// Test setup file
import { config } from 'dotenv';
config();

// Mock Supabase client
jest.mock('../app.js', () => ({
    supabase: {
        auth: {
            getSession: jest.fn().mockResolvedValue({
                data: { session: null },
                error: null
            })
        }
    }
})); 