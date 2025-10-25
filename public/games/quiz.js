const API_BASE = window.location.origin;

class QuizGame {
    constructor() {
        this.questions = [
            {
                question: "What is the capital of France?",
                options: ["London", "Berlin", "Paris", "Madrid"],
                correct: 2
            },
            {
                question: "Which planet is known as the Red Planet?",
                options: ["Venus", "Mars", "Jupiter", "Saturn"],
                correct: 1
            },
            {
                question: "What is 2 + 2?",
                options: ["3", "4", "5", "6"],
                correct: 1
            },
            {
                question: "Who painted the Mona Lisa?",
                options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
                correct: 2
            },
            {
                question: "What is the largest ocean on Earth?",
                options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
                correct: 3
            },
            {
                question: "Which programming language is known as the 'language of the web'?",
                options: ["Python", "JavaScript", "Java", "C++"],
                correct: 1
            },
            {
                question: "What year did World War II end?",
                options: ["1943", "1944", "1945", "1946"],
                correct: 2
            },
            {
                question: "What is the smallest prime number?",
                options: ["0", "1", "2", "3"],
                correct: 2
            },
            {
                question: "Which element has the chemical symbol 'O'?",
                options: ["Gold", "Oxygen", "Osmium", "Oganesson"],
                correct: 1
            },
            {
                question: "Who wrote 'Romeo and Juliet'?",
                options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
                correct: 1
            }
        ];

        this.currentQuestion = 0;
        this.score = 0;
        this.correctAnswers = 0;
        this.startTime = 0;
        this.soundEnabled = true;
        this.audioContext = null;
        this.userAnswers = [];

        this.init();
    }

    init() {
        this.loadLeaderboard();

        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            this.audioContext = new (AudioContext || webkitAudioContext)();
        }

        document.getElementById('startQuiz').addEventListener('click', () => this.startQuiz());
        document.getElementById('soundToggle').addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
        });
    }

    startQuiz() {
        this.currentQuestion = 0;
        this.score = 0;
        this.correctAnswers = 0;
        this.startTime = Date.now();
        this.userAnswers = [];
        this.shuffleQuestions();
        this.showQuestion();
        this.startTimer();
    }

    shuffleQuestions() {
        for (let i = this.questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.questions[i], this.questions[j]] = [this.questions[j], this.questions[i]];
        }
    }

    showQuestion() {
        const question = this.questions[this.currentQuestion];
        const content = document.getElementById('quizContent');

        document.getElementById('questionNumber').textContent = `Question ${this.currentQuestion + 1} of ${this.questions.length}`;
        document.getElementById('gameScore').textContent = `Score: ${this.score}`;

        content.innerHTML = `
            <div class="quiz-question">
                <h3>${question.question}</h3>
            </div>
            <div class="quiz-options">
                ${question.options.map((option, index) => `
                    <div class="quiz-option" data-index="${index}">
                        <strong>${String.fromCharCode(65 + index)}.</strong> ${option}
                    </div>
                `).join('')}
            </div>
        `;

        document.querySelectorAll('.quiz-option').forEach(option => {
            option.addEventListener('click', () => this.handleAnswer(parseInt(option.dataset.index)));
        });
    }

    handleAnswer(selectedIndex) {
        const question = this.questions[this.currentQuestion];
        const options = document.querySelectorAll('.quiz-option');
        const isCorrect = selectedIndex === question.correct;

        this.userAnswers.push({
            question: question.question,
            selected: question.options[selectedIndex],
            correct: question.options[question.correct],
            isCorrect
        });

        options.forEach(option => {
            option.classList.add('disabled');
            const index = parseInt(option.dataset.index);

            if (index === question.correct) {
                option.classList.add('correct');
            } else if (index === selectedIndex) {
                option.classList.add('incorrect');
            }
        });

        if (isCorrect) {
            this.score += 10;
            this.correctAnswers++;
            this.playSound(600, 0.2);
        } else {
            this.playSound(200, 0.3);
        }

        document.getElementById('gameScore').textContent = `Score: ${this.score}`;

        setTimeout(() => {
            this.currentQuestion++;
            if (this.currentQuestion < this.questions.length) {
                this.showQuestion();
            } else {
                this.showResults();
            }
        }, 1500);
    }

    showResults() {
        clearInterval(this.timerInterval);
        const timeTaken = Math.floor((Date.now() - this.startTime) / 1000);
        const content = document.getElementById('quizContent');

        const bonusScore = Math.max(0, 50 - timeTaken);
        this.score += bonusScore;

        content.innerHTML = `
            <div class="quiz-results">
                <h3>🎉 Quiz Complete!</h3>
                <div class="quiz-summary">
                    <p><strong>Final Score:</strong> ${this.score}</p>
                    <p><strong>Correct Answers:</strong> ${this.correctAnswers} / ${this.questions.length}</p>
                    <p><strong>Time Taken:</strong> ${timeTaken} seconds</p>
                    <p><strong>Time Bonus:</strong> +${bonusScore} points</p>
                </div>
                <div style="margin: 2rem 0;">
                    <h4>Review Your Answers:</h4>
                    ${this.userAnswers.map((answer, index) => `
                        <div style="margin: 1rem 0; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                            <p><strong>Q${index + 1}:</strong> ${answer.question}</p>
                            <p style="color: ${answer.isCorrect ? 'var(--success)' : 'var(--error)'};">
                                Your answer: ${answer.selected}
                            </p>
                            ${!answer.isCorrect ? `<p style="color: var(--success);">Correct answer: ${answer.correct}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
                <button id="restartQuiz" class="btn btn-play btn-block">Play Again</button>
            </div>
        `;

        document.getElementById('restartQuiz').addEventListener('click', () => this.startQuiz());

        this.playSound(700, 0.5);
        this.submitScore();
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            document.getElementById('timer').textContent = `Time: ${elapsed}s`;
        }, 1000);
    }

    async submitScore() {
        const token = localStorage.getItem('token');
        if (!token || this.score === 0) return;

        try {
            await fetch(`${API_BASE}/scores/quiz`, {
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
            const response = await fetch(`${API_BASE}/leaderboard/quiz?limit=10`);
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

const game = new QuizGame();
