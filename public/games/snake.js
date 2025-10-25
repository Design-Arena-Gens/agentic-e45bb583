const API_BASE = window.location.origin;

class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('snakeCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;

        this.snake = [{ x: 10, y: 10 }];
        this.food = { x: 15, y: 15 };
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.highScore = 0;
        this.gameActive = false;
        this.gamePaused = false;
        this.speed = 100;
        this.soundEnabled = true;
        this.audioContext = null;

        this.init();
    }

    init() {
        this.setupControls();
        this.loadLeaderboard();
        this.draw();

        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            this.audioContext = new (AudioContext || webkitAudioContext)();
        }

        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    setupControls() {
        document.getElementById('startGame').addEventListener('click', () => this.startGame());
        document.getElementById('pauseGame').addEventListener('click', () => this.togglePause());

        document.getElementById('speed').addEventListener('change', (e) => {
            this.speed = parseInt(e.target.value);
            if (this.gameActive && !this.gamePaused) {
                clearInterval(this.gameLoop);
                this.gameLoop = setInterval(() => this.update(), this.speed);
            }
        });

        document.getElementById('soundToggle').addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
        });
    }

    startGame() {
        this.snake = [{ x: 10, y: 10 }];
        this.dx = 1;
        this.dy = 0;
        this.score = 0;
        this.gameActive = true;
        this.gamePaused = false;
        this.placeFood();
        this.updateScore();

        document.getElementById('startGame').disabled = true;
        document.getElementById('pauseGame').disabled = false;

        if (this.gameLoop) clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => this.update(), this.speed);
    }

    togglePause() {
        this.gamePaused = !this.gamePaused;
        document.getElementById('pauseGame').textContent = this.gamePaused ? 'Resume' : 'Pause';

        if (this.gamePaused) {
            clearInterval(this.gameLoop);
        } else {
            this.gameLoop = setInterval(() => this.update(), this.speed);
        }
    }

    handleKeyPress(e) {
        if (!this.gameActive || this.gamePaused) return;

        switch (e.key) {
            case 'ArrowUp':
                if (this.dy === 0) {
                    this.dx = 0;
                    this.dy = -1;
                }
                e.preventDefault();
                break;
            case 'ArrowDown':
                if (this.dy === 0) {
                    this.dx = 0;
                    this.dy = 1;
                }
                e.preventDefault();
                break;
            case 'ArrowLeft':
                if (this.dx === 0) {
                    this.dx = -1;
                    this.dy = 0;
                }
                e.preventDefault();
                break;
            case 'ArrowRight':
                if (this.dx === 0) {
                    this.dx = 1;
                    this.dy = 0;
                }
                e.preventDefault();
                break;
        }
    }

    update() {
        if (!this.gameActive || this.gamePaused) return;

        const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };

        // Check wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }

        // Check self collision
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScore();
            this.placeFood();
            this.playSound(500, 0.1);
        } else {
            this.snake.pop();
        }

        this.draw();
    }

    placeFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));

        this.food = newFood;
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--bg-secondary').trim();
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.ctx.strokeStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--border').trim();
        this.ctx.lineWidth = 0.5;
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }

        // Draw snake
        this.snake.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? '#4caf50' : '#66bb6a';
            this.ctx.fillRect(
                segment.x * this.gridSize + 1,
                segment.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });

        // Draw food
        this.ctx.fillStyle = '#f44336';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }

    updateScore() {
        document.getElementById('gameScore').textContent = `Score: ${this.score}`;

        if (this.score > this.highScore) {
            this.highScore = this.score;
            document.getElementById('highScore').textContent = `High Score: ${this.highScore}`;
        }
    }

    gameOver() {
        this.gameActive = false;
        clearInterval(this.gameLoop);

        document.getElementById('startGame').disabled = false;
        document.getElementById('pauseGame').disabled = true;

        this.playSound(200, 0.5);

        // Draw game over text
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 20);

        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);

        this.submitScore();
    }

    async submitScore() {
        const token = localStorage.getItem('token');
        if (!token || this.score === 0) return;

        try {
            await fetch(`${API_BASE}/scores/snake`, {
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
            const response = await fetch(`${API_BASE}/leaderboard/snake?limit=10`);
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

const game = new SnakeGame();
