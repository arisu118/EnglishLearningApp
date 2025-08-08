// English Learning App JavaScript

class EnglishLearningApp {
    constructor() {
        this.currentUser = null;
        this.currentTopic = null;
        this.currentVocabularies = [];
        this.currentVocabIndex = 0;
        this.currentQuiz = [];
        this.currentQuizIndex = 0;
        this.quizAnswers = [];
        this.isCardFlipped = false;
        
        this.init();
    }
    
    init() {
        // Check if user is already logged in
        const token = localStorage.getItem('token');
        if (token) {
            this.validateToken(token);
        } else {
            this.showLogin();
        }
    }
    
    async validateToken(token) {
        try {
            const response = await fetch('/api/progress', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const userData = JSON.parse(localStorage.getItem('user'));
                this.currentUser = userData;
                this.showApp();
                this.loadProgress();
            } else {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                this.showLogin();
            }
        } catch (error) {
            console.error('Token validation failed:', error);
            this.showLogin();
        }
    }
    
    showLogin() {
        document.getElementById('auth-section').style.display = 'block';
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('app-content').style.display = 'none';
    }
    
    showRegister() {
        document.getElementById('auth-section').style.display = 'block';
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
        document.getElementById('app-content').style.display = 'none';
    }
    
    showApp() {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('app-content').style.display = 'block';
        document.getElementById('auth-buttons').style.display = 'none';
        document.getElementById('user-menu').style.display = 'block';
        document.getElementById('username').textContent = this.currentUser.username;
        
        this.showDashboard();
        this.loadTopics();
    }
    
    showDashboard() {
        document.getElementById('dashboard').style.display = 'block';
        document.getElementById('vocabulary-section').style.display = 'none';
        document.getElementById('quiz-section').style.display = 'none';
        document.getElementById('results-section').style.display = 'none';
    }
    
    showVocabulary() {
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('vocabulary-section').style.display = 'block';
        document.getElementById('quiz-section').style.display = 'none';
        document.getElementById('results-section').style.display = 'none';
    }
    
    showQuiz() {
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('vocabulary-section').style.display = 'none';
        document.getElementById('quiz-section').style.display = 'block';
        document.getElementById('results-section').style.display = 'none';
    }
    
    showResults() {
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('vocabulary-section').style.display = 'none';
        document.getElementById('quiz-section').style.display = 'none';
        document.getElementById('results-section').style.display = 'block';
    }
    
    async login(event) {
        event.preventDefault();
        
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const result = await response.json();
            
            if (result.success) {
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                this.currentUser = result.user;
                this.showApp();
                this.showAlert('Login successful!', 'success');
            } else {
                this.showAlert(result.message, 'danger');
            }
        } catch (error) {
            this.showAlert('Login failed. Please try again.', 'danger');
        }
    }
    
    async register(event) {
        event.preventDefault();
        
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showAlert('Registration successful! Please login.', 'success');
                this.showLogin();
            } else {
                this.showAlert(result.message, 'danger');
            }
        } catch (error) {
            this.showAlert('Registration failed. Please try again.', 'danger');
        }
    }
    
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.currentUser = null;
        document.getElementById('auth-buttons').style.display = 'block';
        document.getElementById('user-menu').style.display = 'none';
        this.showLogin();
    }
    
    async loadTopics() {
        try {
            const response = await fetch('/api/topics');
            const topics = await response.json();
            
            const container = document.getElementById('topics-container');
            container.innerHTML = '';
            
            topics.forEach(topic => {
                const topicCard = document.createElement('div');
                topicCard.className = 'col-md-6 col-lg-4 mb-3';
                topicCard.innerHTML = `
                    <div class="card topic-card" onclick="app.selectTopic(${topic.id}, '${topic.name}')">
                        <div class="card-body">
                            <span class="badge">${topic.level}</span>
                            <h4>${topic.name}</h4>
                            <p class="mt-2">${topic.description}</p>
                        </div>
                    </div>
                `;
                container.appendChild(topicCard);
            });
        } catch (error) {
            this.showAlert('Failed to load topics', 'danger');
        }
    }
    
    async selectTopic(topicId, topicName) {
        this.currentTopic = { id: topicId, name: topicName };
        document.getElementById('topic-title').textContent = `Learning: ${topicName}`;
        
        try {
            const response = await fetch(`/api/topics/${topicId}/vocabularies`);
            this.currentVocabularies = await response.json();
            this.currentVocabIndex = 0;
            
            if (this.currentVocabularies.length > 0) {
                this.showVocabulary();
                this.displayCurrentWord();
            } else {
                this.showAlert('No vocabulary found for this topic', 'warning');
            }
        } catch (error) {
            this.showAlert('Failed to load vocabulary', 'danger');
        }
    }
    
    displayCurrentWord() {
        if (this.currentVocabIndex >= this.currentVocabularies.length) {
            this.showAlert('You have completed all words in this topic!', 'success');
            return;
        }
        
        const vocab = this.currentVocabularies[this.currentVocabIndex];
        document.getElementById('word-display').textContent = vocab.word;
        document.getElementById('meaning-display').textContent = vocab.meaning;
        document.getElementById('pronunciation-display').textContent = vocab.pronunciation;
        document.getElementById('example-display').textContent = vocab.example;
        
        // Reset card to front
        document.getElementById('flashcard-front').style.display = 'block';
        document.getElementById('flashcard-back').style.display = 'none';
        this.isCardFlipped = false;
    }
    
    flipCard() {
        const front = document.getElementById('flashcard-front');
        const back = document.getElementById('flashcard-back');
        
        if (this.isCardFlipped) {
            front.style.display = 'block';
            back.style.display = 'none';
        } else {
            front.style.display = 'none';
            back.style.display = 'block';
        }
        this.isCardFlipped = !this.isCardFlipped;
    }
    
    nextWord(understood) {
        // Here you could track progress
        this.currentVocabIndex++;
        this.displayCurrentWord();
    }
    
    async startQuiz() {
        if (!this.currentTopic) {
            this.showAlert('Please select a topic first', 'warning');
            return;
        }
        
        try {
            const response = await fetch(`/api/topics/${this.currentTopic.id}/quiz`);
            this.currentQuiz = await response.json();
            this.currentQuizIndex = 0;
            this.quizAnswers = [];
            
            if (this.currentQuiz.length > 0) {
                this.showQuiz();
                this.displayQuizQuestion();
            } else {
                this.showAlert('No quiz available for this topic', 'warning');
            }
        } catch (error) {
            this.showAlert('Failed to load quiz', 'danger');
        }
    }
    
    displayQuizQuestion() {
        if (this.currentQuizIndex >= this.currentQuiz.length) {
            this.submitQuiz();
            return;
        }
        
        const question = this.currentQuiz[this.currentQuizIndex];
        const container = document.getElementById('quiz-container');
        
        container.innerHTML = `
            <div class="quiz-question">
                <h4>Question ${this.currentQuizIndex + 1} of ${this.currentQuiz.length}</h4>
                <h5 class="mb-4">${question.question}</h5>
                <div class="quiz-options">
                    ${Object.entries(question.options).map(([key, value]) => `
                        <div class="quiz-option" onclick="app.selectAnswer('${key}')">
                            <strong>${key}.</strong> ${value}
                        </div>
                    `).join('')}
                </div>
                <div class="mt-4">
                    <button class="btn btn-primary" onclick="app.nextQuestion()" disabled id="next-btn">
                        ${this.currentQuizIndex === this.currentQuiz.length - 1 ? 'Finish Quiz' : 'Next Question'}
                    </button>
                </div>
            </div>
        `;
    }
    
    selectAnswer(answer) {
        // Remove previous selections
        document.querySelectorAll('.quiz-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Mark selected option
        event.target.classList.add('selected');
        
        // Store answer
        this.quizAnswers[this.currentQuizIndex] = {
            quiz_id: this.currentQuiz[this.currentQuizIndex].id,
            selected_answer: answer,
            correct_answer: this.currentQuiz[this.currentQuizIndex].correct_answer,
            is_correct: answer === this.currentQuiz[this.currentQuizIndex].correct_answer
        };
        
        // Enable next button
        document.getElementById('next-btn').disabled = false;
    }
    
    nextQuestion() {
        this.currentQuizIndex++;
        this.displayQuizQuestion();
    }
    
    async submitQuiz() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/quiz/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ results: this.quizAnswers })
            });
            
            const result = await response.json();
            this.displayResults(result);
        } catch (error) {
            this.showAlert('Failed to submit quiz', 'danger');
        }
    }
    
    displayResults(result) {
        this.showResults();
        
        const scoreDisplay = document.getElementById('score-display');
        const scoreDetails = document.getElementById('score-details');
        
        let scoreClass = 'score-poor';
        if (result.score >= 90) scoreClass = 'score-excellent';
        else if (result.score >= 70) scoreClass = 'score-good';
        else if (result.score >= 50) scoreClass = 'score-fair';
        
        scoreDisplay.innerHTML = `<span class="${scoreClass}">${result.score.toFixed(1)}%</span>`;
        scoreDetails.innerHTML = `
            <p>You got <strong>${result.correct}</strong> out of <strong>${result.total}</strong> questions correct!</p>
            <div class="progress mb-3">
                <div class="progress-bar ${scoreClass.replace('score-', 'bg-')}" 
                     style="width: ${result.score}%"></div>
            </div>
        `;
        
        // Update progress
        this.loadProgress();
    }
    
    async loadProgress() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/progress', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const progress = await response.json();
            
            document.getElementById('learned-words').textContent = progress.learned_words;
            document.getElementById('avg-score').textContent = `${progress.average_score}%`;
            document.getElementById('quizzes-taken').textContent = progress.quizzes_taken;
        } catch (error) {
            console.error('Failed to load progress:', error);
        }
    }
    
    showAlert(message, type) {
        // Remove existing alerts
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.querySelector('.container').insertBefore(alert, document.querySelector('.container').firstChild);
        
        // Auto dismiss after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }
}

// Initialize app
const app = new EnglishLearningApp();

// Global functions for HTML onclick events
function showLogin() {
    app.showLogin();
}

function showRegister() {
    app.showRegister();
}

function login(event) {
    app.login(event);
}

function register(event) {
    app.register(event);
}

function logout() {
    app.logout();
}

function showDashboard() {
    app.showDashboard();
}

function showVocabulary() {
    app.showVocabulary();
}

function flipCard() {
    app.flipCard();
}

function nextWord(understood) {
    app.nextWord(understood);
}

function startQuiz() {
    app.startQuiz();
}
