import { supabase } from './setup.js';

describe('Supabase Integration', () => {
    test('should initialize Supabase client', () => {
        expect(supabase).toBeDefined();
        expect(supabase.from).toBeDefined();
        expect(typeof supabase.from).toBe('function');
    });

    test('should be able to get session', async () => {
        const { data, error } = await supabase.auth.getSession();
        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.session).toBeNull(); // We expect null session in tests
    });
}); 