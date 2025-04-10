const { supabase } = require('./setup.js');

describe('Database Schema', () => {
    let testCohortId;

    beforeAll(async () => {
        // Create a test cohort that we'll use for related tests
        const { data: cohort, error: cohortError } = await supabase
            .from('cohorts')
            .insert({ code: 'TEST123', label: 'Test Cohort' })
            .select()
            .single();

        if (cohortError) {
            console.error('Failed to create test cohort:', cohortError);
            throw cohortError;
        }
        testCohortId = cohort.id;
    });

    afterAll(async () => {
        // Clean up test data
        const { error } = await supabase
            .from('cohorts')
            .delete()
            .eq('id', testCohortId);
        
        if (error) {
            console.error('Failed to clean up test cohort:', error);
        }
    });

    test('should be able to insert and retrieve from cohorts table', async () => {
        const testCohort = {
            code: 'TEST456',
            label: 'Another Test Cohort'
        };

        // Insert test data
        const { data: insertData, error: insertError } = await supabase
            .from('cohorts')
            .insert(testCohort)
            .select()
            .single();

        expect(insertError).toBeNull();
        expect(insertData).toBeDefined();
        expect(insertData.code).toBe(testCohort.code);
        expect(insertData.label).toBe(testCohort.label);

        // Clean up
        await supabase
            .from('cohorts')
            .delete()
            .eq('id', insertData.id);
    });

    test('should be able to create and retrieve surveys', async () => {
        const testSurvey = {
            json_config: {
                theme: {
                    title: 'Test Survey',
                    description: 'Test Description'
                },
                statements: [
                    {
                        id: 'test_1',
                        text: 'Test statement 1',
                        alignment: 'left',
                        continuum: 'test_continuum',
                        hasDontUnderstand: true
                    }
                ],
                continua: {
                    test_continuum: {
                        name: 'Test Continuum',
                        description: 'Test continuum description',
                        labels: {
                            left: 'Left',
                            right: 'Right'
                        }
                    }
                }
            }
        };

        // Insert survey
        const { data: survey, error: surveyError } = await supabase
            .from('surveys')
            .insert(testSurvey)
            .select()
            .single();

        expect(surveyError).toBeNull();
        expect(survey).toBeDefined();
        expect(survey.json_config).toEqual(testSurvey.json_config);

        // Clean up
        await supabase
            .from('surveys')
            .delete()
            .eq('id', survey.id);
    });

    test('should be able to create and verify participant responses', async () => {
        // Create a test survey
        const { data: survey, error: surveyError } = await supabase
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

        // Create a test participant
        const testParticipant = {
            passcode: 'TEST123',
            cohort_id: testCohortId,
            survey_id: survey.id
        };

        const { data: participant, error: participantError } = await supabase
            .from('participants')
            .insert(testParticipant)
            .select()
            .single();

        if (participantError) {
            console.error('Failed to create test participant:', participantError);
            throw participantError;
        }

        // Create a test response
        const testResponse = {
            participant_id: participant.id,
            question_key: 'test_1',
            likert_value: 1,
            dont_understand: false
        };

        const { data: response, error: responseError } = await supabase
            .from('responses')
            .insert(testResponse)
            .select()
            .single();

        expect(responseError).toBeNull();
        expect(response).toBeDefined();
        expect(response.likert_value).toBe(testResponse.likert_value);
        expect(response.dont_understand).toBe(testResponse.dont_understand);

        // Clean up
        await supabase
            .from('responses')
            .delete()
            .eq('id', response.id);
        await supabase
            .from('participants')
            .delete()
            .eq('id', participant.id);
        await supabase
            .from('surveys')
            .delete()
            .eq('id', survey.id);
    });
}); 