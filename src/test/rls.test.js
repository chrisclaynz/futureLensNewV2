const { supabase } = require('./setup.js');
const { createClient } = require('@supabase/supabase-js');

describe('Row Level Security Tests', () => {
    let testCohortId;
    let testSurveyId;
    let participant1Id;
    let participant2Id;
    let participant1Passcode = 'PASS123';
    let participant2Passcode = 'PASS456';

    // Create separate Supabase clients for each participant
    const participant1Client = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY,
        {
            global: {
                headers: {
                    passcode: participant1Passcode
                }
            }
        }
    );

    const participant2Client = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY,
        {
            global: {
                headers: {
                    passcode: participant2Passcode
                }
            }
        }
    );

    // Create admin client with service role key for setup/cleanup
    const adminClient = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            db: {
                schema: 'public'
            }
        }
    );

    beforeAll(async () => {
        // Create test cohort
        const { data: cohort, error: cohortError } = await adminClient
            .from('cohorts')
            .insert({ code: 'RLSTEST', label: 'RLS Test Cohort' })
            .select()
            .single();

        if (cohortError) {
            console.error('Failed to create test cohort:', cohortError);
            throw cohortError;
        }
        testCohortId = cohort.id;

        // Create test survey
        const { data: survey, error: surveyError } = await adminClient
            .from('surveys')
            .insert({
                json_config: {
                    statements: [{ id: 'test_1' }]
                }
            })
            .select()
            .single();

        if (surveyError) {
            console.error('Failed to create test survey:', surveyError);
            throw surveyError;
        }
        testSurveyId = survey.id;

        // Create test participants
        const { data: participant1, error: participant1Error } = await adminClient
            .from('participants')
            .insert({
                passcode: participant1Passcode,
                cohort_id: testCohortId,
                survey_id: testSurveyId
            })
            .select()
            .single();

        if (participant1Error) {
            console.error('Failed to create participant 1:', participant1Error);
            throw participant1Error;
        }
        participant1Id = participant1.id;

        const { data: participant2, error: participant2Error } = await adminClient
            .from('participants')
            .insert({
                passcode: participant2Passcode,
                cohort_id: testCohortId,
                survey_id: testSurveyId
            })
            .select()
            .single();

        if (participant2Error) {
            console.error('Failed to create participant 2:', participant2Error);
            throw participant2Error;
        }
        participant2Id = participant2.id;
    });

    afterAll(async () => {
        // Clean up test data using admin client
        await adminClient.from('responses').delete().eq('participant_id', participant1Id);
        await adminClient.from('responses').delete().eq('participant_id', participant2Id);
        await adminClient.from('participants').delete().eq('id', participant1Id);
        await adminClient.from('participants').delete().eq('id', participant2Id);
        await adminClient.from('surveys').delete().eq('id', testSurveyId);
        await adminClient.from('cohorts').delete().eq('id', testCohortId);
    });

    test('participant can only access their own data with correct passcode', async () => {
        // Create a response for participant 1
        const { data: response1, error: response1Error } = await participant1Client
            .from('responses')
            .insert({
                participant_id: participant1Id,
                question_key: 'test_1',
                likert_value: 1,
                dont_understand: false
            })
            .select()
            .single();

        expect(response1Error).toBeNull();
        expect(response1).toBeDefined();

        // Try to access participant 1's data with participant 2's client
        const { data: unauthorizedData, error: unauthorizedError } = await participant2Client
            .from('responses')
            .select()
            .eq('participant_id', participant1Id)
            .single();

        expect(unauthorizedError).not.toBeNull();
        expect(unauthorizedData).toBeNull();
    });

    test('participant can create and read their own responses', async () => {
        // Create a response for participant 2
        const { data: response, error: insertError } = await participant2Client
            .from('responses')
            .insert({
                participant_id: participant2Id,
                question_key: 'test_1',
                likert_value: 2,
                dont_understand: false
            })
            .select()
            .single();

        expect(insertError).toBeNull();
        expect(response).toBeDefined();

        // Verify participant 2 can read their own response
        const { data: readResponse, error: readError } = await participant2Client
            .from('responses')
            .select()
            .eq('participant_id', participant2Id)
            .single();

        expect(readError).toBeNull();
        expect(readResponse).toBeDefined();
        expect(readResponse.likert_value).toBe(2);
    });

    test('participant cannot modify another participant\'s data', async () => {
        // Create a response for participant 1 using admin client
        const { data: response1, error: response1Error } = await adminClient
            .from('responses')
            .insert({
                participant_id: participant1Id,
                question_key: 'test_1',
                likert_value: 1,
                dont_understand: false
            })
            .select()
            .single();

        expect(response1Error).toBeNull();

        // Try to update participant 1's response as participant 2
        const { error: updateError } = await participant2Client
            .from('responses')
            .update({ likert_value: 2 })
            .eq('id', response1.id);

        expect(updateError).not.toBeNull();
    });
}); 