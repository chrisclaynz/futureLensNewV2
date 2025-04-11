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

    // Add CSS for the submit button
    const style = document.createElement('style');
    style.textContent = `
        .submit-btn {
            background-color: #4CAF50;
            color: white;
            font-weight: bold;
            padding: 15px 30px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s;
            font-size: 16px;
            display: inline-block;
            margin: 10px auto;
        }
        
        .submit-btn:hover {
            background-color: #45a049;
        }
    `;
    document.head.appendChild(style);
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
                    <button id="next-btn" class="${index === questions.length - 1 ? 'submit-btn' : ''}">
                        ${index < questions.length - 1 ? 'Next' : 'FINAL SUBMISSION'}
                    </button>
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
            const dontUnderstandCheckbox = document.getElementById('dont-understand-checkbox');
            
            // Store the response, maintaining the don't understand state
            userResponses[question.id] = {
                likert_value: response,
                dont_understand: dontUnderstandCheckbox ? dontUnderstandCheckbox.checked : false
            };
            
            // Save to localStorage
            localStorage.setItem('userResponses', JSON.stringify(userResponses));
        });
    });
    
    // Add event listener to checkbox if it exists
    const dontUnderstandCheckbox = document.getElementById('dont-understand-checkbox');
    if (dontUnderstandCheckbox) {
        dontUnderstandCheckbox.addEventListener('change', (e) => {
            // Get current likert value if it exists
            const currentLikertValue = userResponses[question.id]?.likert_value;
            
            // Update the user response, maintaining the likert value
            userResponses[question.id] = {
                likert_value: currentLikertValue,
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
            // Check if user has selected a valid response
            const currentResponse = userResponses[question.id];
            const hasValidLikertValue = currentResponse && currentResponse.likert_value !== null && [-2, -1, 1, 2].includes(currentResponse.likert_value);
            
            if (!hasValidLikertValue) {
                alert('Please select a response (Strongly Disagree, Disagree, Agree, or Strongly Agree).');
                return;
            }
            
            // Save the response locally before moving to the next question
            try {
                const response = {
                    participant_id: localStorage.getItem('participantId'),
                    question_key: question.id,
                    likert_value: currentResponse.likert_value,
                    dont_understand: currentResponse.dont_understand,
                    inserted_at: new Date().toISOString()
                };

                // Save to localStorage
                const responses = JSON.parse(localStorage.getItem('responses') || '{}');
                responses[question.id] = response;
                localStorage.setItem('responses', JSON.stringify(responses));
                
                if (index < questions.length - 1) {
                    displayQuestion(index + 1);
                } else {
                    // If this is the last question, submit the survey
                    await submitSurvey();
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
            <button id="submit-survey-btn">Submit Survey</button>
        </div>
    `;

    // Add event listener to submit button
    const submitBtn = document.getElementById('submit-survey-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            try {
                // Get all responses from localStorage
                const responses = JSON.parse(localStorage.getItem('responses') || '{}');
                const responseArray = Object.values(responses);

                if (responseArray.length === 0) {
                    alert('No responses to submit. Please complete the survey first.');
                    return;
                }

                if (!isOnline()) {
                    alert('You must be online to submit the survey. Please check your internet connection and try again.');
                    return;
                }

                // Submit responses to Supabase
                const { error } = await supabase
                    .from('responses')
                    .upsert(responseArray, { 
                        onConflict: ['participant_id', 'question_key'],
                        ignoreDuplicates: false
                    });

                if (error) {
                    console.error('Error submitting survey:', error);
                    alert('Error submitting survey. Please try again.');
                    return;
                }

                // Clear all survey-related data from localStorage
                const keysToRemove = [
                    'responses',
                    'userResponses',
                    'questionOrder',
                    'currentQuestionIndex',
                    'participantId',
                    'passcode',
                    'mode'
                ];
                
                keysToRemove.forEach(key => localStorage.removeItem(key));
                
                // Set survey submitted flag
                localStorage.setItem('surveySubmitted', 'true');
                
                // Use a timeout to ensure localStorage is cleared before redirect
                setTimeout(() => {
                    window.location.href = 'results.html';
                }, 100);
            } catch (error) {
                console.error('Error during submission:', error);
                alert('Error submitting survey. Please try again.');
            }
        });
    }
}

/**
 * Displays the next question in the survey
 */
function displayNextQuestion() {
    const currentIndex = parseInt(localStorage.getItem('currentQuestionIndex') || '0');
    displayQuestion(currentIndex + 1);
}

/**
 * Checks if the device is online
 * @returns {boolean} - True if online, false if offline
 */
function isOnline() {
    return navigator.onLine;
}

/**
 * Saves a response to local storage
 * @param {string} questionId - The ID of the question
 * @param {number} likertValue - The Likert scale value
 * @param {boolean} dontUnderstand - Whether the user marked "don't understand"
 * @returns {Promise<boolean>} - True if the response was saved successfully
 */
async function saveResponse(questionId, likertValue, dontUnderstand) {
    const response = {
        participant_id: localStorage.getItem('participantId'),
        question_key: questionId,
        likert_value: likertValue,
        dont_understand: dontUnderstand,
        inserted_at: new Date().toISOString()
    };

    // Store in local responses for navigation
    userResponses[questionId] = {
        likertValue,
        dontUnderstand,
        inserted_at: response.inserted_at
    };

    // Save to localStorage
    const responses = JSON.parse(localStorage.getItem('responses') || '{}');
    responses[questionId] = response;
    localStorage.setItem('responses', JSON.stringify(responses));
    
    return true;
}

async function submitSurvey() {
    const responses = JSON.parse(localStorage.getItem('responses') || '{}');
    const responseArray = Object.values(responses);

    try {
        if (!isOnline()) {
            alert('You must be online to submit the survey. Please check your internet connection and try again.');
            return;
        }

        const { error } = await supabase
            .from('responses')
            .upsert(responseArray, { 
                onConflict: ['participant_id', 'question_key'],
                ignoreDuplicates: false
            });

        if (error) {
            console.error('Error submitting survey:', error);
            alert('Error submitting survey. Please try again.');
            return;
        }

        // Clear all survey-related data from localStorage
        const keysToRemove = [
            'responses',
            'userResponses',
            'questionOrder',
            'currentQuestionIndex',
            'participantId',
            'passcode',
            'mode'
        ];
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Set survey submitted flag
        localStorage.setItem('surveySubmitted', 'true');
        
        // Use a timeout to ensure localStorage is cleared before redirect
        setTimeout(() => {
            window.location.href = 'results.html';
        }, 100);
    } catch (error) {
        console.error('Error during submission:', error);
        alert('Error submitting survey. Please try again.');
    }
}

// Remove auto-sync on online event
window.removeEventListener('online', syncResponses);

// On login, check if the survey is already submitted
const surveySubmitted = localStorage.getItem('surveySubmitted') === 'true';
const currentPath = window.location.pathname;

if (surveySubmitted && !currentPath.includes('results.html')) {
    window.location.replace('/results.html');
}

/**
 * Syncs any unsynced responses with the database
 * @returns {Promise<boolean>} - True if all responses were synced successfully
 */
async function syncResponses() {
    if (!isOnline()) {
        console.log('Device is offline, cannot sync responses');
        return false;
    }

    const unsyncedResponses = JSON.parse(localStorage.getItem('unsyncedResponses') || '[]');
    if (unsyncedResponses.length === 0) {
        console.log('No unsynced responses to sync');
        return true;
    }

    console.log(`Syncing ${unsyncedResponses.length} responses...`);
    const failedSyncs = [];
    const MAX_RETRIES = 3;

    for (const response of unsyncedResponses) {
        let retryCount = 0;
        let success = false;

        while (retryCount < MAX_RETRIES && !success) {
            try {
                const { error } = await supabase
                    .from('responses')
                    .upsert(response, {
                        onConflict: 'participant_id,question_key'
                    });

                if (error) {
                    console.error(`Error syncing response (attempt ${retryCount + 1}):`, error);
                    retryCount++;
                    // Wait before retrying (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
                } else {
                    success = true;
                }
            } catch (error) {
                console.error(`Error syncing response (attempt ${retryCount + 1}):`, error);
                retryCount++;
                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            }
        }

        if (!success) {
            failedSyncs.push(response);
        }
    }

    // Update localStorage with only the failed syncs
    localStorage.setItem('unsyncedResponses', JSON.stringify(failedSyncs));

    // Return true only if all responses were synced successfully
    return failedSyncs.length === 0;
}

// Add event listeners for online/offline status
let syncInProgress = false;
let pendingSync = false;

window.addEventListener('online', async () => {
    console.log('Device is online, checking for unsynced responses...');
    
    if (syncInProgress) {
        console.log('Sync already in progress, marking for later sync');
        pendingSync = true;
        return;
    }

    try {
        syncInProgress = true;
        const success = await syncResponses();
        if (success) {
            console.log('All responses synced successfully');
        } else {
            console.log('Some responses failed to sync, will retry later');
        }
    } catch (error) {
        console.error('Error during sync:', error);
    } finally {
        syncInProgress = false;
        if (pendingSync) {
            pendingSync = false;
            window.dispatchEvent(new Event('online'));
        }
    }
});

window.addEventListener('offline', () => {
    console.log('Device is offline, responses will be saved locally');
    // Clear any pending syncs
    pendingSync = false;
});

// Export functions for use in other files
export {
    fetchSurvey,
    initSurvey,
    displayNextQuestion,
    displayQuestion,
    isOnline,
    saveResponse,
    syncResponses
}; 