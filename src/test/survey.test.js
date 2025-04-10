// Mock the supabase module before importing the component that uses it
jest.mock('../supabase.js', () => ({
    supabase: {
        from: jest.fn()
    }
}));

// Import the component to test
import { fetchSurvey } from '../survey.js';
import { supabase } from '../supabase.js';

// Mock localStorage for tests
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn(key => store[key]),
        setItem: jest.fn((key, value) => {
            store[key] = value.toString();
        }),
        clear: jest.fn(() => {
            store = {};
        }),
        removeItem: jest.fn(key => {
            delete store[key];
        })
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock survey data to be returned by the mock supabase client
const mockSurveyData = {
    id: 'test-survey-id',
    json_config: {
        theme: {
            title: 'Test Survey',
            description: 'Test survey description'
        },
        statements: [
            {
                id: 'test_1',
                text: 'Test question 1',
                alignment: 'left',
                continuum: 'testing',
                hasDontUnderstand: true
            },
            {
                id: 'test_2',
                text: 'Test question 2',
                alignment: 'right',
                continuum: 'testing',
                hasDontUnderstand: true
            }
        ],
        continua: {
            testing: {
                name: 'Testing',
                description: 'Test continuum',
                labels: {
                    left: 'Left',
                    right: 'Right'
                }
            }
        }
    },
    inserted_at: '2023-01-01T00:00:00.000Z'
};

describe('Survey functionality tests', () => {
    
    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        // Configure the from method to return our mock data
        const mockSelect = jest.fn().mockReturnThis();
        const mockEq = jest.fn().mockReturnThis();
        const mockLimit = jest.fn().mockReturnThis();
        const mockSingle = jest.fn().mockResolvedValue({ data: mockSurveyData, error: null });
        
        supabase.from.mockImplementation(() => ({
            select: mockSelect,
            eq: mockEq,
            limit: mockLimit,
            single: mockSingle
        }));
    });
    
    test('fetchSurvey should return valid JSON config when given a valid survey ID', async () => {
        // Call the fetchSurvey function with a test ID
        const result = await fetchSurvey('test-survey-id');
        
        // Verify supabase client was called correctly
        expect(supabase.from).toHaveBeenCalledWith('surveys');
        
        // Check if the result contains the expected data
        expect(result).toEqual(mockSurveyData.json_config);
        
        // Validate the structure of the returned object
        expect(result).toHaveProperty('statements');
        expect(Array.isArray(result.statements)).toBe(true);
        expect(result.statements.length).toBe(2);
        expect(result.statements[0]).toHaveProperty('id');
        expect(result.statements[0]).toHaveProperty('text');
        
        // Verify theme properties
        expect(result).toHaveProperty('theme');
        expect(result.theme).toHaveProperty('title');
        expect(result.theme).toHaveProperty('description');
        
        // Verify continua properties
        expect(result).toHaveProperty('continua');
        expect(result.continua).toHaveProperty('testing');
    });
    
    test('fetchSurvey should use limit(1) when given ID "1"', async () => {
        // Mock the limit function to track if it was called
        const mockLimit = jest.fn().mockReturnThis();
        const mockSingle = jest.fn().mockResolvedValue({ data: mockSurveyData, error: null });
        
        supabase.from.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            limit: mockLimit,
            single: mockSingle
        }));
        
        // Call fetchSurvey with ID "1"
        await fetchSurvey('1');
        
        // Verify limit was called with 1
        expect(mockLimit).toHaveBeenCalledWith(1);
    });
    
    test('fetchSurvey should throw an error when survey is not found', async () => {
        // Mock supabase to return no data
        supabase.from.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null })
        }));
        
        // Expect fetchSurvey to throw an error
        await expect(fetchSurvey('non-existent-id')).rejects.toThrow('Survey not found');
    });
    
    test('fetchSurvey should throw an error when json_config has invalid structure', async () => {
        // Mock supabase to return invalid json_config
        const invalidSurveyData = {
            ...mockSurveyData,
            json_config: { theme: { title: 'Invalid Survey' } } // No statements array
        };
        
        supabase.from.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: invalidSurveyData, error: null })
        }));
        
        // Expect fetchSurvey to throw an error
        await expect(fetchSurvey('invalid-structure-id')).rejects.toThrow('Invalid survey structure');
    });
    
    test('fetchSurvey should handle database errors gracefully', async () => {
        // Mock supabase to return an error
        supabase.from.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ 
                data: null, 
                error: { message: 'Database error' } 
            })
        }));
        
        // Expect fetchSurvey to throw the database error
        await expect(fetchSurvey('error-id')).rejects.toMatchObject({ message: 'Database error' });
    });
}); 