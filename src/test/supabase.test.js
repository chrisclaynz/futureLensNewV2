import { supabase } from '../app.js';

describe('Supabase Integration', () => {
    test('should initialize Supabase client', () => {
        expect(supabase).toBeDefined();
        expect(supabase.auth).toBeDefined();
    });

    test('should be able to get session', async () => {
        const { data, error } = await supabase.auth.getSession();
        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.session).toBeNull(); // We expect null session in tests
    });
}); 