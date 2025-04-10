import { handleLogin, isLoggedIn, logout, getCurrentMode, getCurrentIdentifier, clearSession } from '../auth.js';
import { supabase } from './setup.js';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn(key => store[key]),
        setItem: jest.fn((key, value) => {
            store[key] = value;
        }),
        removeItem: jest.fn(key => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        })
    };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Simple test to verify Jest setup
describe('Auth Module', () => {
    test('should pass a basic test', () => {
        expect(true).toBe(true);
    });
});

describe('Authentication', () => {
    beforeEach(() => {
        // Clear localStorage and mocks before each test
        localStorage.clear();
        jest.clearAllMocks();
    });

    test('should have auth object', () => {
        expect(supabase.auth).toBeDefined();
    });

    test('should start with no session', async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        expect(error).toBeNull();
        expect(session).toBeNull();
    });

    test('handleLogin should normalize passcode to uppercase', async () => {
        const mockData = { id: '123', passcode: 'TEST123' };
        const mockFrom = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockData, error: null })
        });
        supabase.from.mockImplementation(mockFrom);

        await handleLogin('test123');
        expect(mockFrom).toHaveBeenCalledWith('participants');
        expect(mockFrom().eq).toHaveBeenCalledWith('passcode', 'TEST123');
    });

    test('handleLogin should store participant data on successful login', async () => {
        const mockData = {
            id: '123',
            passcode: 'TEST123',
            cohort_id: '456',
            survey_id: '789'
        };
        supabase.from.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockData, error: null })
        }));

        const result = await handleLogin('TEST123');
        expect(result.success).toBe(true);
        expect(localStorage.setItem).toHaveBeenCalledWith(
            'participant',
            JSON.stringify({
                id: '123',
                passcode: 'TEST123',
                cohort_id: '456',
                survey_id: '789'
            })
        );
    });

    test('handleLogin should return error for invalid passcode', async () => {
        supabase.from.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null })
        }));

        const result = await handleLogin('INVALID');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid passcode');
    });

    test('handleLogin should handle database errors', async () => {
        const mockError = new Error('Database error');
        supabase.from.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: mockError })
        }));

        const result = await handleLogin('TEST123');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Database error occurred');
    });

    test('isLoggedIn should return true when participant data exists', () => {
        localStorage.setItem('participant', JSON.stringify({ id: '123' }));
        expect(isLoggedIn()).toBe(true);
    });

    test('isLoggedIn should return false when no participant data exists', () => {
        expect(isLoggedIn()).toBe(false);
    });

    test('logout should remove participant data', () => {
        localStorage.setItem('participant', JSON.stringify({ id: '123' }));
        logout();
        expect(localStorage.removeItem).toHaveBeenCalledWith('participant');
        expect(isLoggedIn()).toBe(false);
    });

    describe('Anonymous Mode', () => {
        test('should store survey code in localStorage for anonymous mode', async () => {
            const surveyCode = 'ANON123';
            const result = await handleLogin(surveyCode, 'anonymous');

            expect(result.success).toBe(true);
            expect(localStorage.getItem('surveyCode')).toBe(surveyCode.toUpperCase());
            expect(localStorage.getItem('mode')).toBe('anonymous');
        });

        test('should normalize survey code case', async () => {
            const surveyCode = 'anon123';
            const result = await handleLogin(surveyCode, 'anonymous');

            expect(result.success).toBe(true);
            expect(localStorage.getItem('surveyCode')).toBe('ANON123');
        });

        test('should return current mode and identifier', async () => {
            const surveyCode = 'ANON123';
            await handleLogin(surveyCode, 'anonymous');

            expect(getCurrentMode()).toBe('anonymous');
            expect(getCurrentIdentifier()).toEqual({
                surveyCode: 'ANON123'
            });
        });
    });

    describe('Identifiable Mode', () => {
        test('should validate passcode against participants table', async () => {
            // Create a test participant
            const testPasscode = 'TEST123';
            const { data: participant } = await supabase
                .from('participants')
                .insert({ passcode: testPasscode })
                .select()
                .single();

            const result = await handleLogin(testPasscode, 'identifiable');

            expect(result.success).toBe(true);
            expect(localStorage.getItem('participantId')).toBe(participant.id);
            expect(localStorage.getItem('passcode')).toBe(testPasscode);
            expect(localStorage.getItem('mode')).toBe('identifiable');

            // Clean up
            await supabase
                .from('participants')
                .delete()
                .eq('id', participant.id);
        });

        test('should return error for invalid passcode', async () => {
            const result = await handleLogin('INVALID123', 'identifiable');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid passcode');
        });

        test('should return current mode and identifier', async () => {
            const testPasscode = 'TEST123';
            const { data: participant } = await supabase
                .from('participants')
                .insert({ passcode: testPasscode })
                .select()
                .single();

            await handleLogin(testPasscode, 'identifiable');

            expect(getCurrentMode()).toBe('identifiable');
            expect(getCurrentIdentifier()).toEqual({
                participantId: participant.id,
                passcode: testPasscode
            });

            // Clean up
            await supabase
                .from('participants')
                .delete()
                .eq('id', participant.id);
        });
    });

    describe('Session Management', () => {
        test('should clear all session data', async () => {
            await handleLogin('ANON123', 'anonymous');
            clearSession();

            expect(localStorage.getItem('surveyCode')).toBeNull();
            expect(localStorage.getItem('mode')).toBeNull();
        });

        test('should handle mode switching', async () => {
            // Start in anonymous mode
            await handleLogin('ANON123', 'anonymous');
            expect(getCurrentMode()).toBe('anonymous');

            // Switch to identifiable mode
            const testPasscode = 'TEST123';
            const { data: participant } = await supabase
                .from('participants')
                .insert({ passcode: testPasscode })
                .select()
                .single();

            await handleLogin(testPasscode, 'identifiable');
            expect(getCurrentMode()).toBe('identifiable');
            expect(localStorage.getItem('surveyCode')).toBeNull();

            // Clean up
            await supabase
                .from('participants')
                .delete()
                .eq('id', participant.id);
        });
    });
}); 