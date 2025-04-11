import { jest } from '@jest/globals';
import { supabase } from '../supabase.js';
import { saveResponse, syncResponses, isOnline } from '../survey.js';

// Mock Supabase client
jest.mock('../supabase.js', () => ({
    supabase: {
        from: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis()
    }
}));

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value.toString();
        }),
        clear: jest.fn(() => {
            store = {};
        })
    };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
    value: true,
    writable: true
});

describe('Offline Sync Functionality', () => {
    beforeEach(() => {
        // Clear localStorage and reset mocks before each test
        localStorage.clear();
        jest.clearAllMocks();
        navigator.onLine = true;
    });

    test('should save response to localStorage when offline', async () => {
        // Set device to offline
        navigator.onLine = false;

        // Save a response
        await saveResponse('question1', 1, false);

        // Check that response was saved to localStorage
        const unsyncedResponses = JSON.parse(localStorage.getItem('unsyncedResponses') || '[]');
        expect(unsyncedResponses).toHaveLength(1);
        expect(unsyncedResponses[0].question_key).toBe('question1');
        expect(unsyncedResponses[0].likert_value).toBe(1);
    });

    test('should save response to Supabase when online', async () => {
        // Mock successful Supabase insert
        supabase.from().insert.mockResolvedValueOnce({ error: null });

        // Save a response
        await saveResponse('question1', 1, false);

        // Check that response was saved to Supabase
        expect(supabase.from().insert).toHaveBeenCalledWith(expect.objectContaining({
            question_key: 'question1',
            likert_value: 1
        }));
    });

    test('should sync unsynced responses when coming back online', async () => {
        // First save some responses while offline
        navigator.onLine = false;
        await saveResponse('question1', 1, false);
        await saveResponse('question2', 2, false);

        // Mock successful Supabase inserts
        supabase.from().insert.mockResolvedValue({ error: null });

        // Go back online and sync
        navigator.onLine = true;
        const result = await syncResponses();

        // Check that all responses were synced
        expect(result).toBe(true);
        expect(supabase.from().insert).toHaveBeenCalledTimes(2);
        expect(localStorage.getItem('unsyncedResponses')).toBe('[]');
    });

    test('should handle failed syncs gracefully', async () => {
        // First save some responses while offline
        navigator.onLine = false;
        await saveResponse('question1', 1, false);
        await saveResponse('question2', 2, false);

        // Mock one successful and one failed Supabase insert
        supabase.from().insert
            .mockResolvedValueOnce({ error: null })
            .mockResolvedValueOnce({ error: new Error('Failed to insert') });

        // Go back online and sync
        navigator.onLine = true;
        const result = await syncResponses();

        // Check that failed response remains in localStorage
        expect(result).toBe(false);
        const remainingResponses = JSON.parse(localStorage.getItem('unsyncedResponses') || '[]');
        expect(remainingResponses).toHaveLength(1);
        expect(remainingResponses[0].question_key).toBe('question2');
    });
}); 