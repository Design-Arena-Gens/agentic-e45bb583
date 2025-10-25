const API_BASE = window.location.origin;

const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'index.html';
}

async function loadProfile() {
    const container = document.getElementById('profileContent');

    try {
        const response = await fetch(`${API_BASE}/users/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Failed to load profile');
        }

        const data = await response.json();
        const user = data.user;
        const bestScores = data.bestScores || {};

        const gameNames = {
            tictactoe: 'Tic-Tac-Toe',
            snake: 'Snake',
            quiz: 'Quiz'
        };

        container.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar">
                    ${user.profilePicture ? `<img src="${user.profilePicture}" alt="${user.username}">` : user.username.charAt(0).toUpperCase()}
                </div>
                <div class="profile-info">
                    <h2>${user.username}</h2>
                    <p class="profile-email">${user.email}</p>
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">Member since ${new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
            </div>

            <div class="scores-section">
                <h3>Best Scores</h3>
                <div class="scores-grid">
                    ${Object.keys(gameNames).map(gameId => `
                        <div class="score-card">
                            <h3>${gameNames[gameId]}</h3>
                            <div class="score-value">${bestScores[gameId] || 0}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="edit-section">
                <button class="btn btn-primary" onclick="openEditModal()">Edit Profile</button>
                <button class="btn btn-primary" onclick="openPasswordModal()">Change Password</button>
            </div>
        `;
    } catch (error) {
        container.innerHTML = '<div class="error-msg">Failed to load profile. Please try again.</div>';
    }
}

function openEditModal() {
    const user = JSON.parse(localStorage.getItem('user'));
    document.getElementById('editUsername').value = user.username;
    document.getElementById('editProfilePic').value = user.profilePicture || '';
    document.getElementById('editModal').style.display = 'block';
}

function openPasswordModal() {
    document.getElementById('passwordModal').style.display = 'block';
}

document.getElementById('closeEdit').addEventListener('click', () => {
    document.getElementById('editModal').style.display = 'none';
});

document.getElementById('closePassword').addEventListener('click', () => {
    document.getElementById('passwordModal').style.display = 'none';
});

document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('editUsername').value;
    const profilePicture = document.getElementById('editProfilePic').value;

    try {
        const response = await fetch(`${API_BASE}/users/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username, profilePicture })
        });

        const data = await response.json();

        if (!response.ok) {
            document.getElementById('editError').textContent = data.error || 'Failed to update profile';
            return;
        }

        localStorage.setItem('user', JSON.stringify(data.user));
        document.getElementById('editSuccess').textContent = 'Profile updated successfully!';
        setTimeout(() => {
            document.getElementById('editModal').style.display = 'none';
            loadProfile();
        }, 1500);
    } catch (error) {
        document.getElementById('editError').textContent = 'Network error. Please try again.';
    }
});

document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;

    try {
        const response = await fetch(`${API_BASE}/users/change-password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await response.json();

        if (!response.ok) {
            document.getElementById('passwordError').textContent = data.error || 'Failed to change password';
            return;
        }

        document.getElementById('passwordSuccess').textContent = 'Password changed successfully!';
        setTimeout(() => {
            document.getElementById('passwordModal').style.display = 'none';
            document.getElementById('passwordForm').reset();
        }, 1500);
    } catch (error) {
        document.getElementById('passwordError').textContent = 'Network error. Please try again.';
    }
});

loadProfile();
