// Mock for the Supabase client
export const supabase = {
    from: jest.fn(),
    auth: {
        getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
        signOut: jest.fn().mockResolvedValue({ error: null })
    }
};

export default supabase; 