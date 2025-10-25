const API_BASE = window.location.origin;

const modal = document.getElementById('authModal');
const authBtn = document.getElementById('authBtn');
const closeBtn = document.querySelector('.close');
const authForm = document.getElementById('authForm');
const toggleAuth = document.getElementById('toggleAuth');
const modalTitle = document.getElementById('modalTitle');
const usernameGroup = document.getElementById('usernameGroup');
const toggleAuthText = document.getElementById('toggleAuthText');
const errorMsg = document.getElementById('errorMsg');
const profileLink = document.getElementById('profileLink');

let isLoginMode = true;

function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        authBtn.textContent = 'Logout';
        authBtn.onclick = logout;
        if (profileLink) profileLink.style.display = 'inline';
    } else {
        authBtn.textContent = 'Login';
        authBtn.onclick = () => { modal.style.display = 'block'; };
        if (profileLink) profileLink.style.display = 'none';
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    checkAuth();
    window.location.href = 'index.html';
}

authBtn.addEventListener('click', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        modal.style.display = 'block';
    }
});

closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

toggleAuth.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;

    if (isLoginMode) {
        modalTitle.textContent = 'Login';
        usernameGroup.style.display = 'none';
        toggleAuthText.textContent = "Don't have an account?";
        toggleAuth.textContent = 'Sign up';
    } else {
        modalTitle.textContent = 'Sign Up';
        usernameGroup.style.display = 'block';
        toggleAuthText.textContent = 'Already have an account?';
        toggleAuth.textContent = 'Login';
    }

    errorMsg.textContent = '';
    authForm.reset();
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.textContent = '';

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value;

    const endpoint = isLoginMode ? '/auth/login' : '/auth/register';
    const body = isLoginMode ? { email, password } : { email, password, username };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
            errorMsg.textContent = data.error || 'An error occurred';
            return;
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        modal.style.display = 'none';
        checkAuth();

        if (window.location.pathname.includes('profile.html')) {
            location.reload();
        }
    } catch (error) {
        errorMsg.textContent = 'Network error. Please try again.';
    }
});

checkAuth();
