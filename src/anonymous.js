import { supabase } from './supabase.js';
import { getCurrentIdentifier } from './auth.js';

export async function getAnonymousResponses() {
    const { surveyCode } = getCurrentIdentifier();
    const { data: responses, error } = await supabase
        .from('responses')
        .select('*')
        .eq('survey_code', surveyCode)
        .eq('is_anonymous', true);

    if (error) {
        console.error('Error fetching anonymous responses:', error);
        throw new Error('Failed to fetch responses');
    }

    return responses;
}

export async function getAnonymousProgress() {
    const responses = await getAnonymousResponses();
    const questionOrder = JSON.parse(localStorage.getItem('questionOrder'));
    
    const requiredAnswered = questionOrder.required.filter(id => 
        responses.some(r => r.question_key === id)
    ).length;
    
    const optionalAnswered = questionOrder.optional.filter(id => 
        responses.some(r => r.question_key === id)
    ).length;

    return {
        required: {
            total: questionOrder.required.length,
            answered: requiredAnswered,
            progress: (requiredAnswered / questionOrder.required.length) * 100
        },
        optional: {
            total: questionOrder.optional.length,
            answered: optionalAnswered,
            progress: questionOrder.optional.length > 0 
                ? (optionalAnswered / questionOrder.optional.length) * 100 
                : 0
        }
    };
}

export async function getAnonymousResults() {
    const responses = await getAnonymousResponses();
    const questionOrder = JSON.parse(localStorage.getItem('questionOrder'));
    const survey = JSON.parse(localStorage.getItem('survey'));

    // Group responses by continuum
    const continuumScores = {};
    Object.keys(survey.continua).forEach(continuum => {
        continuumScores[continuum] = {
            total: 0,
            count: 0,
            average: 0
        };
    });

    responses.forEach(response => {
        const question = survey.statements.find(q => q.id === response.question_key);
        if (question && question.continuum) {
            const continuum = continuumScores[question.continuum];
            continuum.total += response.likert_value;
            continuum.count += 1;
        }
    });

    // Calculate averages
    Object.keys(continuumScores).forEach(continuum => {
        const data = continuumScores[continuum];
        data.average = data.count > 0 ? data.total / data.count : 0;
    });

    return {
        continua: continuumScores,
        totalQuestions: questionOrder.required.length + questionOrder.optional.length,
        answeredQuestions: responses.length
    };
}

export function displayAnonymousProgress(progress) {
    const container = document.createElement('div');
    container.className = 'progress-container';

    // Required questions progress
    const requiredProgress = document.createElement('div');
    requiredProgress.className = 'progress-section';
    requiredProgress.innerHTML = `
        <h3>Required Questions</h3>
        <div class="progress-bar">
            <div class="progress" style="width: ${progress.required.progress}%"></div>
        </div>
        <p>${progress.required.answered} of ${progress.required.total} completed</p>
    `;
    container.appendChild(requiredProgress);

    // Optional questions progress
    if (progress.optional.total > 0) {
        const optionalProgress = document.createElement('div');
        optionalProgress.className = 'progress-section';
        optionalProgress.innerHTML = `
            <h3>Optional Questions</h3>
            <div class="progress-bar">
                <div class="progress" style="width: ${progress.optional.progress}%"></div>
            </div>
            <p>${progress.optional.answered} of ${progress.optional.total} completed</p>
        `;
        container.appendChild(optionalProgress);
    }

    return container;
}

export function displayAnonymousResults(results) {
    const container = document.createElement('div');
    container.className = 'results-container';

    // Overall completion
    const completion = document.createElement('div');
    completion.className = 'completion-stats';
    completion.innerHTML = `
        <h2>Survey Completion</h2>
        <p>You have answered ${results.answeredQuestions} of ${results.totalQuestions} questions</p>
    `;
    container.appendChild(completion);

    // Continuum results
    const continua = document.createElement('div');
    continua.className = 'continuum-results';
    continua.innerHTML = '<h2>Your Results</h2>';

    Object.entries(results.continua).forEach(([continuum, data]) => {
        const continuumElement = document.createElement('div');
        continuumElement.className = 'continuum-result';
        continuumElement.innerHTML = `
            <h3>${continuum}</h3>
            <p>Average Score: ${data.average.toFixed(2)}</p>
            <p>Based on ${data.count} responses</p>
        `;
        continua.appendChild(continuumElement);
    });

    container.appendChild(continua);

    return container;
} 