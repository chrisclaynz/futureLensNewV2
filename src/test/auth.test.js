const { supabase } = require('./setup.js');

// Simple test to verify Jest setup
describe('Auth Module', () => {
    test('should pass a basic test', () => {
        expect(true).toBe(true);
    });
});

describe('Authentication', () => {
    test('should have auth object', () => {
        expect(supabase.auth).toBeDefined();
    });

    test('should start with no session', async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        expect(error).toBeNull();
        expect(session).toBeNull();
    });
}); 