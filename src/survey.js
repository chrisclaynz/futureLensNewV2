import { supabase } from './supabase.js';

// Survey management functionality
let currentSurvey = null;
let questionOrder = [];
let currentQuestionIndex = 0;
let userResponses = {}; // Store user responses to allow navigation

/**
 * Fetches a survey's JSON config from the database
 * @param {string} surveyId - The ID of the survey to fetch
 * @returns {Promise<Object>} - The survey configuration
 */
async function fetchSurvey(surveyId) {
    try {
        // First try to get the survey by ID
        let query = supabase
            .from('surveys')
            .select('*');
        
        if (surveyId === '1') {
            // For test survey, get the first survey
            query = query.limit(1);
        } else {
            query = query.eq('id', surveyId);
        }

        const { data, error } = await query.single();

        if (error) throw error;
        if (!data) throw new Error('Survey not found');

        console.log('Fetched survey data:', data);
        console.log('Survey json_config:', data.json_config);
        console.log('Survey json_config type:', typeof data.json_config);
        console.log('Survey json_config statements:', data.json_config?.statements);
        console.log('Survey json_config statements length:', data.json_config?.statements?.length);
        
        // Ensure we're returning the parsed JSON config
        const jsonConfig = typeof data.json_config === 'string' 
            ? JSON.parse(data.json_config)
            : data.json_config;

        // Validate the survey structure
        if (!jsonConfig.statements || !Array.isArray(jsonConfig.statements)) {
            console.error('Invalid survey structure - missing statements array:', jsonConfig);
            throw new Error('Invalid survey structure');
        }

        return jsonConfig;
    } catch (error) {
        console.error('Error fetching survey:', error);
        throw error;
    }
}

/**
 * Initializes the survey with the provided JSON configuration
 * @param {Object} surveyJson - The survey configuration
 */
function initSurvey(surveyJson) {
    currentSurvey = surveyJson;
    
    // Extract and shuffle questions
    console.log('Survey JSON:', surveyJson);
    console.log('Survey JSON statements:', surveyJson.statements);
    console.log('Survey JSON statements type:', typeof surveyJson.statements);
    
    const questions = surveyJson.statements;
    console.log('Questions array:', questions);
    console.log('Number of questions:', questions.length);
    console.log('First question:', questions[0]);
    console.log('Second question:', questions[1]);
    
    if (!Array.isArray(questions) || questions.length === 0) {
        console.error('No questions found in survey:', surveyJson);
        throw new Error('Survey has no questions');
    }
    
    questionOrder = shuffleArray([...questions]);
    console.log('Shuffled question order:', questionOrder);
    console.log('Number of shuffled questions:', questionOrder.length);
    
    // Initialize user responses object
    userResponses = {};
    questionOrder.forEach(q => {
        userResponses[q.id] = {
            likert_value: null,
            dont_understand: false
        };
    });
    
    // Store the order in localStorage
    localStorage.setItem('questionOrder', JSON.stringify(questionOrder));
    localStorage.setItem('currentQuestionIndex', '0');
    localStorage.setItem('userResponses', JSON.stringify(userResponses));
    
    // Display the first question
    displayQuestion(0);
}

/**
 * Shuffles an array using the Fisher-Yates algorithm
 * @param {Array} array - The array to shuffle
 * @returns {Array} - The shuffled array
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Displays a specific question in the survey
 * @param {number} index - The index of the question to display
 */
function displayQuestion(index) {
    const questions = JSON.parse(localStorage.getItem('questionOrder') || '[]');
    userResponses = JSON.parse(localStorage.getItem('userResponses') || '{}');
    
    // Ensure index is within bounds
    if (index < 0) index = 0;
    if (index >= questions.length) {
        // Survey complete
        showSurveyComplete();
        return;
    }
    
    // Update current index in localStorage
    localStorage.setItem('currentQuestionIndex', index.toString());
    currentQuestionIndex = index;
    
    console.log('Displaying question:', index + 1, 'of', questions.length);
    console.log('All questions:', questions);
    console.log('Current question:', questions[index]);
    
    const question = questions[index];
    if (!question) {
        console.error('No question found at index:', index);
        return;
    }
    
    const container = document.getElementById('survey-container');
    
    // Get current response for this question if it exists
    const currentResponse = userResponses[question.id] || { likert_value: null, dont_understand: false };
    
    container.innerHTML = `
        <div class="question-container">
            <div class="question-header">
                <h3>Question ${index + 1} of ${questions.length}</h3>
            </div>
            
            <div class="question-text-container">
                <p class="question-text">${question.text}</p>
            </div>
            
            <div class="response-section">
                <div class="response-options">
                    <button class="response-btn ${currentResponse.likert_value === -2 ? 'selected' : ''}" data-value="-2">Strongly Disagree</button>
                    <button class="response-btn ${currentResponse.likert_value === -1 ? 'selected' : ''}" data-value="-1">Disagree</button>
                    <button class="response-btn ${currentResponse.likert_value === 1 ? 'selected' : ''}" data-value="1">Agree</button>
                    <button class="response-btn ${currentResponse.likert_value === 2 ? 'selected' : ''}" data-value="2">Strongly Agree</button>
                </div>
                
                ${question.hasDontUnderstand ? `
                <div class="dont-understand-container">
                    <input type="checkbox" id="dont-understand-checkbox" ${currentResponse.dont_understand ? 'checked' : ''}>
                    <label for="dont-understand-checkbox">I don't understand this question</label>
                </div>` : ''}
                
                <div class="navigation-buttons">
                    ${index > 0 ? '<button id="prev-btn">Back</button>' : '<div style="width:100px;"></div>'}
                    <button id="next-btn">${index < questions.length - 1 ? 'Next' : 'Finish'}</button>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners to response buttons
    document.querySelectorAll('.response-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            // Remove selected class from all buttons
            document.querySelectorAll('.response-btn').forEach(btn => btn.classList.remove('selected'));
            
            // Add selected class to clicked button
            button.classList.add('selected');
            
            const response = parseInt(e.target.dataset.value);
            
            // Store the response
            userResponses[question.id] = {
                likert_value: response,
                dont_understand: document.getElementById('dont-understand-checkbox')?.checked || false
            };
            
            // Save to localStorage
            localStorage.setItem('userResponses', JSON.stringify(userResponses));
        });
    });
    
    // Add event listener to checkbox if it exists
    const dontUnderstandCheckbox = document.getElementById('dont-understand-checkbox');
    if (dontUnderstandCheckbox) {
        dontUnderstandCheckbox.addEventListener('change', (e) => {
            // Update the user response with the current checkbox state
            userResponses[question.id] = {
                likert_value: userResponses[question.id]?.likert_value || null,
                dont_understand: e.target.checked
            };
            
            // Save to localStorage
            localStorage.setItem('userResponses', JSON.stringify(userResponses));
        });
    }
    
    // Add event listeners to navigation buttons
    const prevBtn = document.getElementById('prev-btn');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            displayQuestion(index - 1);
        });
    }
    
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', async () => {
            // Check if user has selected a response
            if (userResponses[question.id]?.likert_value === null && !userResponses[question.id]?.dont_understand) {
                alert('Please select a response or check "I don\'t understand this question" before continuing.');
                return;
            }
            
            // Save the response to the database before moving to the next question
            try {
                const response = userResponses[question.id];
                await saveResponse(question.id, response.likert_value, response.dont_understand);
                
                if (index < questions.length - 1) {
                    displayQuestion(index + 1);
                } else {
                    // If this is the last question, show the survey complete page
                    showSurveyComplete();
                }
            } catch (error) {
                console.error('Error saving response:', error);
                alert('Error saving your response. Please try again.');
            }
        });
    }
}

/**
 * Shows the survey complete screen
 */
function showSurveyComplete() {
    const container = document.getElementById('survey-container');
    container.innerHTML = `
        <div class="survey-complete">
            <h2>Survey Complete!</h2>
            <p>Thank you for completing the survey.</p>
        </div>
    `;
}

/**
 * Displays the next question in the survey
 */
function displayNextQuestion() {
    const currentIndex = parseInt(localStorage.getItem('currentQuestionIndex') || '0');
    displayQuestion(currentIndex + 1);
}

/**
 * Saves a response to the database
 * @param {string} questionKey - The ID of the question
 * @param {number} likertValue - The response value
 * @param {boolean} dontUnderstand - Whether the user selected "Don't Understand"
 */
async function saveResponse(questionKey, likertValue, dontUnderstand = false) {
    try {
        console.log('Saving response:', {
            participant_id: localStorage.getItem('participantId'),
            question_key: questionKey,
            likert_value: likertValue,
            dont_understand: dontUnderstand
        });

        const { error } = await supabase
            .from('responses')
            .insert({
                participant_id: localStorage.getItem('participantId'),
                question_key: questionKey,
                likert_value: likertValue,
                dont_understand: dontUnderstand
            });

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }
    } catch (error) {
        console.error('Error saving response:', error);
        throw error;
    }
}

// Export functions for use in other files
export {
    fetchSurvey,
    initSurvey,
    displayNextQuestion,
    displayQuestion
}; 