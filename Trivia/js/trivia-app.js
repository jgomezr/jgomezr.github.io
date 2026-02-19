/**
 * Enhanced Trivia Scout App
 * Modern, accessible, and feature-rich trivia application
 * Version: 2.0.0
 */

class TriviaApp {
    constructor() {
        this.version = "v10";
        this.currentAttempt = 1;
        this.maxAttempts = 3;
        this.score = 0;
        this.totalQuestions = 0;
        this.userAnswers = new Map();
        this.isProcessing = false;
        
        // DOM Elements
        this.quizContainers = {
            bp: document.getElementById('quiz-bp'),
            libros: document.getElementById('quiz-libros'), 
            tecnica: document.getElementById('quiz-tecnica')
        };
        this.resultsContainers = {
            bp: document.getElementById('results-bp'),
            libros: document.getElementById('results-libros'),
            tecnica: document.getElementById('results-tecnica')
        };
        this.submitButton = document.getElementById('submit');
        this.finalResult = document.getElementById('resultFinal');
        this.shareButtons = document.querySelectorAll('.share-btn');
        this.progressBars = document.querySelectorAll('.progress-bar');
        
        this.init();
    }
    
    init() {
        // Load questions data
        this.loadQuestions();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize UI
        this.initializeUI();
        
        // Check for existing attempts
        this.checkExistingAttempts();
    }
    
    loadQuestions() {
        // Questions are loaded from questions.js
        if (typeof window.questions === 'undefined') {
            console.error('Questions data not loaded');
            return;
        }
        
        this.questions = window.questions;
        this.totalQuestions = Object.values(this.questions).reduce((total, category) => total + category.length, 0);
    }
    
    setupEventListeners() {
        // Submit button
        this.submitButton.addEventListener('click', () => this.handleSubmit());
        
        // Share buttons
        this.shareButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleShare(e));
        });
        
        // Answer selection tracking
        Object.keys(this.quizContainers).forEach(category => {
            const container = this.quizContainers[category];
            if (container) {
                container.addEventListener('change', (e) => {
                    if (e.target.type === 'radio') {
                        const questionId = e.target.name;
                        const answer = e.target.value;
                        this.userAnswers.set(questionId, answer);
                        this.updateProgress();
                    }
                });
            }
        });
        
        // Refresh button
        const refreshBtn = document.getElementById('butRefresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshApp());
        }
    }
    
    initializeUI() {
        // Render questions
        this.renderQuestions();
        
        // Update progress bars
        this.updateProgress();
        
        // Set up accessibility
        this.setupAccessibility();
    }
    
    checkExistingAttempts() {
        const savedVersion = this.getCookie('trivia_version');
        const savedAttempts = parseInt(this.getCookie('trivia_attempts') || '0');
        
        if (savedVersion === this.version) {
            this.currentAttempt = Math.min(savedAttempts + 1, this.maxAttempts);
        } else {
            this.currentAttempt = 1;
            this.setCookie('trivia_version', this.version);
        }
        
        this.updateAttemptDisplay();
    }
    
    renderQuestions() {
        Object.entries(this.questions).forEach(([category, questions]) => {
            const container = this.quizContainers[category];
            if (!container) return;
            
            const html = questions.map((question, index) => {
                const questionId = `${category}${index}`;
                const answersHtml = Object.entries(question.answers).map(([key, value]) => `
                    <label class="answer-option" for="${questionId}-${key}">
                        <input type="radio" 
                               id="${questionId}-${key}" 
                               name="${questionId}" 
                               value="${key}"
                               ${this.userAnswers.get(questionId) === key ? 'checked' : ''}>
                        <span class="answer-letter">${key}</span>
                        <span class="answer-text">${value}</span>
                    </label>
                `).join('');
                
                return `
                    <div class="question-card" data-category="${category}" data-index="${index}">
                        <h3 class="question-text">${question.question}</h3>
                        <div class="answers-container">
                            ${answersHtml}
                        </div>
                        <div class="feedback" id="feedback-${questionId}" aria-live="polite"></div>
                    </div>
                `;
            }).join('');
            
            container.innerHTML = html;
        });
    }
    
    setupAccessibility() {
        // Add ARIA labels and roles
        Object.keys(this.quizContainers).forEach(category => {
            const container = this.quizContainers[category];
            const results = this.resultsContainers[category];
            
            if (container) {
                container.setAttribute('role', 'form');
                container.setAttribute('aria-labelledby', `category-title-${category}`);
            }
            
            if (results) {
                results.setAttribute('aria-live', 'polite');
            }
        });
        
        // Ensure proper tab order
        const allInputs = document.querySelectorAll('input[type="radio"]');
        allInputs.forEach((input, index) => {
            input.setAttribute('tabindex', '0');
        });
    }
    
    updateProgress() {
        const answeredCount = this.userAnswers.size;
        const percentage = Math.round((answeredCount / this.totalQuestions) * 100);
        
        this.progressBars.forEach(bar => {
            bar.style.width = `${percentage}%`;
            bar.setAttribute('aria-valuenow', percentage);
        });
        
        // Update progress text
        const progressText = document.querySelector('.progress-text');
        if (progressText) {
            progressText.textContent = `${answeredCount}/${this.totalQuestions} preguntas respondidas`;
        }
    }
    
    async handleSubmit() {
        if (this.isProcessing) return;
        if (this.currentAttempt >= this.maxAttempts) {
            this.showMaxAttemptsMessage();
            return;
        }
        
        this.isProcessing = true;
        this.submitButton.disabled = true;
        this.submitButton.textContent = 'Procesando...';
        
        // Small delay to show processing state
        await this.delay(500);
        
        try {
            this.score = 0;
            this.clearPreviousFeedback();
            
            // Grade each category
            Object.entries(this.questions).forEach(([category, questions]) => {
                const categoryScore = this.gradeCategory(category, questions);
                this.score += categoryScore;
                this.updateCategoryResults(category, categoryScore, questions.length);
            });
            
            // Update final result
            this.updateFinalResult();
            
            // Save attempt
            this.saveAttempt();
            
            // Show completion message
            this.showCompletionMessage();
            
        } catch (error) {
            console.error('Error processing quiz:', error);
            this.showError('Hubo un error al procesar tus respuestas. Por favor, intenta de nuevo.');
        } finally {
            this.isProcessing = false;
            this.submitButton.disabled = false;
            this.submitButton.textContent = 'Obtener los resultados';
            
            // Hide submit button if max attempts reached
            if (this.currentAttempt >= this.maxAttempts) {
                this.submitButton.style.display = 'none';
            }
        }
    }
    
    gradeCategory(category, questions) {
        let categoryScore = 0;
        const container = this.quizContainers[category];
        const answerContainers = container.querySelectorAll('.question-card');
        
        questions.forEach((question, index) => {
            const questionId = `${category}${index}`;
            const userAnswer = this.userAnswers.get(questionId);
            const isCorrect = userAnswer === question.correctAnswer;
            
            if (isCorrect) {
                categoryScore++;
                this.showFeedback(questionId, 'correct', '¡Correcto! 🎉');
            } else {
                this.showFeedback(questionId, 'incorrect', `Incorrecto. La respuesta correcta era: ${question.answers[question.correctAnswer]}`);
            }
        });
        
        return categoryScore;
    }
    
    showFeedback(questionId, type, message) {
        const feedbackElement = document.getElementById(`feedback-${questionId}`);
        if (feedbackElement) {
            feedbackElement.className = `feedback feedback-${type}`;
            feedbackElement.textContent = message;
        }
    }
    
    clearPreviousFeedback() {
        document.querySelectorAll('.feedback').forEach(el => {
            el.className = 'feedback';
            el.textContent = '';
        });
    }
    
    updateCategoryResults(category, score, total) {
        const resultsElement = this.resultsContainers[category];
        if (resultsElement) {
            resultsElement.innerHTML = `
                <div class="category-result">
                    <span class="score">${score}</span>
                    <span class="total">de ${total}</span>
                </div>
            `;
        }
    }
    
    updateFinalResult() {
        this.finalResult.innerHTML = `
            <div class="final-score">
                <span class="score-number">${this.score}</span>
                <span class="score-text">de ${this.totalQuestions} posibles</span>
                <div class="attempt-info">Intento ${this.currentAttempt} de ${this.maxAttempts}</div>
            </div>
        `;
    }
    
    saveAttempt() {
        this.currentAttempt++;
        this.setCookie('trivia_attempts', this.currentAttempt.toString());
        this.updateAttemptDisplay();
    }
    
    updateAttemptDisplay() {
        const attemptInfo = document.querySelector('.attempt-info');
        if (attemptInfo) {
            attemptInfo.textContent = `Intento ${this.currentAttempt} de ${this.maxAttempts}`;
        }
    }
    
    showMaxAttemptsMessage() {
        this.showError('Has alcanzado el máximo de intentos (3). ¡Gracias por jugar!');
    }
    
    showCompletionMessage() {
        // Auto-scroll to results
        this.finalResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    showError(message) {
        // Create or update error message
        let errorDiv = document.getElementById('error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'error-message';
            errorDiv.className = 'error-message';
            document.body.insertBefore(errorDiv, document.body.firstChild);
        }
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
    
    handleShare(e) {
        const platform = e.currentTarget.dataset.platform;
        const score = this.score;
        const total = this.totalQuestions;
        const shareUrl = this.getShareUrl(platform, score, total);
        
        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }
    }
    
    getShareUrl(platform, score, total) {
        const baseUrl = 'http://jgomezr.github.io/Trivia/';
        const scorePage = Math.min(score, 8); // Cap at 8 for existing pages
        
        switch (platform) {
            case 'facebook':
                return `https://www.facebook.com/sharer.php?u=${encodeURIComponent(baseUrl + 'score/' + scorePage + '.html')}&t=Trivia%20Scout`;
            case 'twitter':
                return `https://twitter.com/intent/tweet?text=¡Obtuve ${score} de ${total} en Trivia Scout!&url=${encodeURIComponent(baseUrl)}`;
            case 'whatsapp':
                return `https://api.whatsapp.com/send?text=¡Obtuve ${score} de ${total} en Trivia Scout! ${baseUrl}`;
            default:
                return null;
        }
    }
    
    refreshApp() {
        // Clear user answers but keep the same questions
        this.userAnswers.clear();
        this.renderQuestions();
        this.updateProgress();
        this.clearPreviousFeedback();
        
        // Reset results display
        Object.values(this.resultsContainers).forEach(container => {
            if (container) container.innerHTML = '';
        });
        this.finalResult.innerHTML = '';
    }
    
    // Utility methods
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return '';
    }
    
    setCookie(name, value, days = 7) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TriviaApp();
});