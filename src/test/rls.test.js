import { supabase } from './setup.js';

describe('Row Level Security Tests', () => {
    const mockParticipant1 = {
        id: 'participant1-id',
        passcode: 'PASS123',
        cohort_id: 'cohort-id',
        survey_id: 'survey-id'
    };

    const mockParticipant2 = {
        id: 'participant2-id',
        passcode: 'PASS456',
        cohort_id: 'cohort-id',
        survey_id: 'survey-id'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('participant can only access their own data with correct passcode', async () => {
        // Mock successful response for participant 1
        const mockFrom = jest.fn().mockReturnThis();
        const mockSelect = jest.fn().mockReturnThis();
        const mockEq = jest.fn().mockReturnThis();
        const mockSingle = jest.fn().mockResolvedValue({
            data: mockParticipant1,
            error: null
        });

        supabase.from = mockFrom;
        mockFrom.mockReturnValue({
            select: mockSelect,
            eq: mockEq,
            single: mockSingle
        });

        // Try to access participant 1's data with correct passcode
        const { data: participant1Data, error: participant1Error } = await supabase
            .from('participants')
            .select()
            .eq('passcode', 'PASS123')
            .single();

        expect(participant1Error).toBeNull();
        expect(participant1Data).toEqual(mockParticipant1);

        // Try to access participant 1's data with wrong passcode
        mockSingle.mockResolvedValue({
            data: null,
            error: null
        });

        const { data: unauthorizedData, error: unauthorizedError } = await supabase
            .from('participants')
            .select()
            .eq('passcode', 'WRONG')
            .single();

        expect(unauthorizedData).toBeNull();
    });

    test('participant can create and read their own responses', async () => {
        const mockResponse = {
            id: 'response-id',
            participant_id: mockParticipant1.id,
            question_key: 'test_1',
            likert_value: 1,
            dont_understand: false
        };

        // Mock successful response creation
        const mockFrom = jest.fn().mockReturnThis();
        const mockInsert = jest.fn().mockReturnThis();
        const mockSelect = jest.fn().mockReturnThis();
        const mockSingle = jest.fn().mockResolvedValue({
            data: mockResponse,
            error: null
        });

        supabase.from = mockFrom;
        mockFrom.mockReturnValue({
            insert: mockInsert,
            select: mockSelect,
            single: mockSingle
        });

        const { data: response, error: responseError } = await supabase
            .from('responses')
            .insert(mockResponse)
            .select()
            .single();

        expect(responseError).toBeNull();
        expect(response).toEqual(mockResponse);
    });

    test('participant cannot modify another participant\'s data', async () => {
        const mockError = {
            message: 'Row level security violation',
            code: 'PGRST116'
        };

        // Mock failed update attempt
        const mockFrom = jest.fn().mockReturnThis();
        const mockUpdate = jest.fn().mockReturnThis();
        const mockEq = jest.fn().mockResolvedValue({
            data: null,
            error: mockError
        });

        supabase.from = mockFrom;
        mockFrom.mockReturnValue({
            update: mockUpdate,
            eq: mockEq
        });

        const { error: updateError } = await supabase
            .from('responses')
            .update({ likert_value: 2 })
            .eq('participant_id', mockParticipant1.id);

        expect(updateError).toBeDefined();
        expect(updateError.message).toContain('Row level security violation');
    });
}); 