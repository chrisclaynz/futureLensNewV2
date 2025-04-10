import { fetchSurvey, initSurvey, displayNextQuestion } from './survey.js';

// Mock Supabase client
jest.mock('./supabase', () => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
}));

describe('Survey Module', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        // Reset DOM
        document.body.innerHTML = `
            <div id="survey-container"></div>
        `;
    });

    describe('fetchSurvey', () => {
        it('should fetch survey data from Supabase', async () => {
            const mockSurvey = {
                id: 'test-survey',
                title: 'Test Survey',
                statements: [
                    { id: 'q1', text: 'Question 1' },
                    { id: 'q2', text: 'Question 2' }
                ]
            };

            // Mock Supabase response
            const { from } = require('./supabase');
            from.mockImplementation(() => ({
                select: () => ({
                    eq: () => ({
                        single: () => Promise.resolve({ data: mockSurvey, error: null })
                    })
                })
            }));

            const result = await fetchSurvey('test-survey');
            expect(result).toEqual(mockSurvey);
        });

        it('should throw error when survey fetch fails', async () => {
            // Mock Supabase error
            const { from } = require('./supabase');
            from.mockImplementation(() => ({
                select: () => ({
                    eq: () => ({
                        single: () => Promise.resolve({ data: null, error: new Error('Fetch failed') })
                    })
                })
            }));

            await expect(fetchSurvey('test-survey')).rejects.toThrow('Fetch failed');
        });
    });

    describe('initSurvey', () => {
        it('should initialize survey and store question order in localStorage', () => {
            const mockSurvey = {
                statements: [
                    { id: 'q1', text: 'Question 1' },
                    { id: 'q2', text: 'Question 2' },
                    { id: 'q3', text: 'Question 3' }
                ]
            };

            initSurvey(mockSurvey);

            // Check if question order is stored in localStorage
            const storedOrder = JSON.parse(localStorage.getItem('questionOrder'));
            expect(storedOrder).toHaveLength(3);
            expect(storedOrder.map(q => q.id)).toContain('q1');
            expect(storedOrder.map(q => q.id)).toContain('q2');
            expect(storedOrder.map(q => q.id)).toContain('q3');

            // Check if current index is initialized
            expect(localStorage.getItem('currentQuestionIndex')).toBe('0');
        });
    });

    describe('displayNextQuestion', () => {
        it('should display the first question', () => {
            const mockQuestions = [
                { id: 'q1', text: 'Question 1', hasDontUnderstand: true },
                { id: 'q2', text: 'Question 2', hasDontUnderstand: false }
            ];

            localStorage.setItem('questionOrder', JSON.stringify(mockQuestions));
            localStorage.setItem('currentQuestionIndex', '0');

            displayNextQuestion();

            const container = document.getElementById('survey-container');
            expect(container.innerHTML).toContain('Question 1');
            expect(container.innerHTML).toContain('Question 1 of 2');
            expect(container.innerHTML).toContain('Don\'t Understand');
        });

        it('should display completion message when all questions are answered', () => {
            const mockQuestions = [
                { id: 'q1', text: 'Question 1' },
                { id: 'q2', text: 'Question 2' }
            ];

            localStorage.setItem('questionOrder', JSON.stringify(mockQuestions));
            localStorage.setItem('currentQuestionIndex', '2'); // All questions answered

            displayNextQuestion();

            const container = document.getElementById('survey-container');
            expect(container.innerHTML).toContain('Survey Complete');
        });
    });
}); 