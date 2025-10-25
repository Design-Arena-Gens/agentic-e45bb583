const API_BASE = window.location.origin;

const themeToggle = document.getElementById('themeToggle');
const currentTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);

themeToggle.addEventListener('click', () => {
    const theme = document.documentElement.getAttribute('data-theme');
    const newTheme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

async function loadRecentWinners() {
    const container = document.getElementById('recentWinners');
    if (!container) return;

    try {
        const games = ['tictactoe', 'snake', 'quiz'];
        const allWinners = [];

        for (const game of games) {
            const response = await fetch(`${API_BASE}/leaderboard/${game}/recent?limit=3`);
            const data = await response.json();

            if (data.recentWinners) {
                data.recentWinners.forEach(winner => {
                    allWinners.push({ ...winner, game });
                });
            }
        }

        if (allWinners.length === 0) {
            container.innerHTML = '<div class="loading">No recent winners yet. Be the first!</div>';
            return;
        }

        const gameNames = {
            tictactoe: 'Tic-Tac-Toe',
            snake: 'Snake',
            quiz: 'Quiz'
        };

        container.innerHTML = allWinners.slice(0, 10).map(winner => `
            <div class="winner-card">
                <div class="winner-avatar">
                    ${winner.profilePicture ? `<img src="${winner.profilePicture}" style="width:100%;height:100%;border-radius:50%;">` : winner.username.charAt(0).toUpperCase()}
                </div>
                <div class="winner-name">${winner.username}</div>
                <div class="winner-game" style="font-size: 0.9rem; color: var(--text-secondary);">${gameNames[winner.game]}</div>
                <div class="winner-score" style="font-weight: bold; color: var(--accent);">${winner.score} pts</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading recent winners:', error);
        container.innerHTML = '<div class="loading">Unable to load recent winners</div>';
    }
}

function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onopen = () => {
        console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'scoreUpdate') {
            loadRecentWinners();
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected. Reconnecting...');
        setTimeout(connectWebSocket, 5000);
    };
}

document.addEventListener('DOMContentLoaded', () => {
    loadRecentWinners();
    connectWebSocket();
});
