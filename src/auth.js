import { supabase } from './supabase.js';

/**
 * Handles the login process using a passcode
 * @param {string} code - The passcode to validate
 * @param {string} mode - The mode of login ('identifiable' or 'anonymous')
 * @returns {Promise<{success: boolean, error?: string, participantId?: string}>}
 */
export async function handleLogin(code, mode = 'identifiable') {
    try {
        // Normalize case
        const normalizedCode = code.toUpperCase();
        
        if (mode === 'identifiable') {
            // Check if passcode exists in participants table
            const { data: participant, error } = await supabase
                .from('participants')
                .select('id, passcode')
                .eq('passcode', normalizedCode)
                .single();

            if (error) {
                console.error('Error checking passcode:', error);
                return { success: false, error: 'Invalid passcode' };
            }

            if (!participant) {
                return { success: false, error: 'Invalid passcode' };
            }

            // Store participant info in localStorage
            localStorage.setItem('participantId', participant.id);
            localStorage.setItem('passcode', normalizedCode);
            localStorage.setItem('mode', 'identifiable');

            return { success: true, participantId: participant.id };
        } else {
            // Anonymous mode - just store the survey code
            localStorage.setItem('surveyCode', normalizedCode);
            localStorage.setItem('mode', 'anonymous');
            
            return { success: true };
        }
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'An unexpected error occurred' };
    }
}

/**
 * Checks if a user is currently logged in
 * @returns {boolean}
 */
export function isLoggedIn() {
    return !!localStorage.getItem('participantId');
}

/**
 * Logs out the current user
 */
export function logout() {
    localStorage.removeItem('participantId');
    localStorage.removeItem('passcode');
    localStorage.removeItem('surveyCode');
    localStorage.removeItem('mode');
}

// Authentication module
export function initAuth() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const passcode = document.getElementById('passcode').value;
            handleLogin(passcode);
        });
    }
}

export function getCurrentMode() {
    return localStorage.getItem('mode') || 'anonymous';
}

export function getCurrentIdentifier() {
    const mode = getCurrentMode();
    if (mode === 'identifiable') {
        return {
            participantId: localStorage.getItem('participantId'),
            passcode: localStorage.getItem('passcode')
        };
    } else {
        return {
            surveyCode: localStorage.getItem('surveyCode')
        };
    }
}

export function clearSession() {
    localStorage.removeItem('participantId');
    localStorage.removeItem('passcode');
    localStorage.removeItem('surveyCode');
    localStorage.removeItem('mode');
} 