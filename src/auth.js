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

function handleLogin(passcode) {
    // TODO: Implement actual authentication logic
    console.log('Login attempted with passcode:', passcode);
    // For now, just show a success message
    alert('Login successful! (This is a placeholder)');
} 