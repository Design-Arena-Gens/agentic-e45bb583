const API_BASE = window.location.origin;

class TicTacToe {
    constructor() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = false;
        this.mode = 'ai';
        this.difficulty = 'medium';
        this.score = 0;
        this.soundEnabled = true;
        this.audioContext = null;
        this.init();
    }

    init() {
        this.createBoard();
        this.setupControls();
        this.loadLeaderboard();

        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            this.audioContext = new (AudioContext || webkitAudioContext)();
        }
    }

    createBoard() {
        const boardElement = document.getElementById('tictactoeBoard');
        boardElement.innerHTML = '';

        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.className = 'tictactoe-cell';
            cell.dataset.index = i;
            cell.addEventListener('click', () => this.handleCellClick(i));
            boardElement.appendChild(cell);
        }
    }

    setupControls() {
        document.getElementById('startGame').addEventListener('click', () => this.startGame());
        document.getElementById('resetGame').addEventListener('click', () => this.resetGame());

        document.querySelectorAll('input[name="mode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.mode = e.target.value;
                this.resetGame();
            });
        });

        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
        });

        document.getElementById('soundToggle').addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
        });
    }

    startGame() {
        this.gameActive = true;
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.updateBoard();
        this.updateStatus();
    }

    resetGame() {
        this.gameActive = false;
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.score = 0;
        this.updateBoard();
        this.updateStatus();
    }

    handleCellClick(index) {
        if (!this.gameActive || this.board[index] !== '' || (this.mode === 'ai' && this.currentPlayer === 'O')) {
            return;
        }

        this.makeMove(index, this.currentPlayer);
        this.playSound(300, 0.1);

        if (!this.checkWinner() && this.mode === 'ai' && this.currentPlayer === 'O') {
            setTimeout(() => this.aiMove(), 500);
        }
    }

    makeMove(index, player) {
        this.board[index] = player;
        this.updateBoard();

        if (this.checkWinner()) {
            this.handleGameEnd();
        } else if (!this.board.includes('')) {
            this.handleGameEnd(true);
        } else {
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            this.updateStatus();
        }
    }

    aiMove() {
        const availableMoves = this.board.map((cell, i) => cell === '' ? i : null).filter(i => i !== null);

        if (availableMoves.length === 0) return;

        let move;

        if (this.difficulty === 'hard') {
            move = this.getBestMove();
        } else if (this.difficulty === 'medium' && Math.random() > 0.3) {
            move = this.getBestMove();
        } else {
            move = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        }

        this.makeMove(move, 'O');
        this.playSound(400, 0.1);
    }

    getBestMove() {
        // Try to win
        for (let i = 0; i < 9; i++) {
            if (this.board[i] === '') {
                this.board[i] = 'O';
                if (this.checkWinnerForPlayer('O')) {
                    this.board[i] = '';
                    return i;
                }
                this.board[i] = '';
            }
        }

        // Block player
        for (let i = 0; i < 9; i++) {
            if (this.board[i] === '') {
                this.board[i] = 'X';
                if (this.checkWinnerForPlayer('X')) {
                    this.board[i] = '';
                    return i;
                }
                this.board[i] = '';
            }
        }

        // Take center
        if (this.board[4] === '') return 4;

        // Take corner
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(i => this.board[i] === '');
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }

        // Take any available
        const available = this.board.map((cell, i) => cell === '' ? i : null).filter(i => i !== null);
        return available[Math.floor(Math.random() * available.length)];
    }

    checkWinner() {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        for (const [a, b, c] of lines) {
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                this.highlightWinner([a, b, c]);
                return true;
            }
        }

        return false;
    }

    checkWinnerForPlayer(player) {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        return lines.some(([a, b, c]) =>
            this.board[a] === player && this.board[b] === player && this.board[c] === player
        );
    }

    highlightWinner(cells) {
        cells.forEach(index => {
            document.querySelector(`[data-index="${index}"]`).classList.add('winner');
        });
    }

    handleGameEnd(draw = false) {
        this.gameActive = false;

        if (draw) {
            document.getElementById('currentPlayer').textContent = "It's a draw!";
            this.playSound(200, 0.2);
        } else {
            const winner = this.currentPlayer;
            document.getElementById('currentPlayer').textContent = `${winner} wins!`;

            if (winner === 'X') {
                this.score += 10;
                this.playSound(500, 0.3);
                this.submitScore();
            } else {
                this.playSound(150, 0.3);
            }
        }

        document.getElementById('gameScore').textContent = `Score: ${this.score}`;
    }

    updateBoard() {
        this.board.forEach((value, index) => {
            const cell = document.querySelector(`[data-index="${index}"]`);
            cell.textContent = value;
            cell.classList.toggle('taken', value !== '');
        });
    }

    updateStatus() {
        document.getElementById('currentPlayer').textContent = `Current Player: ${this.currentPlayer}`;
        document.getElementById('gameScore').textContent = `Score: ${this.score}`;
    }

    async submitScore() {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            await fetch(`${API_BASE}/scores/tictactoe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ score: this.score })
            });

            this.loadLeaderboard();
        } catch (error) {
            console.error('Error submitting score:', error);
        }
    }

    async loadLeaderboard() {
        const container = document.getElementById('leaderboard');

        try {
            const response = await fetch(`${API_BASE}/leaderboard/tictactoe?limit=10`);
            const data = await response.json();

            if (data.leaderboard.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No scores yet. Be the first!</p>';
                return;
            }

            container.innerHTML = `
                <table class="leaderboard-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Player</th>
                            <th>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.leaderboard.map((entry, index) => `
                            <tr>
                                <td><span class="rank-badge ${index < 3 ? ['gold', 'silver', 'bronze'][index] : ''}">${entry.rank}</span></td>
                                <td>
                                    <div class="player-info">
                                        <div class="player-avatar-small">
                                            ${entry.profilePicture ? `<img src="${entry.profilePicture}">` : entry.username.charAt(0).toUpperCase()}
                                        </div>
                                        ${entry.username}
                                    </div>
                                </td>
                                <td><strong>${entry.score}</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            container.innerHTML = '<p style="text-align: center; color: var(--error);">Failed to load leaderboard</p>';
        }
    }

    playSound(frequency, duration) {
        if (!this.soundEnabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
}

const game = new TicTacToe();
