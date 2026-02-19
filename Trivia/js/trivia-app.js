/**
 * Enhanced Trivia Scout App - ROBUST VERSION
 * Modern, accessible, and feature-rich trivia application
 * Version: 2.0.2 (Fixed submit button reliability)
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
        this.allQuestionsAnswered = false;
        
        // DOM Elements
        this.categoriesContainer = document.querySelector('.categories-container');
        this.submitButton = document.getElementById('submitBtn');
        this.retryButton = document.getElementById('retryBtn');
        this.finalScoreElement = document.getElementById('finalScore');
        this.performanceFeedback = document.getElementById('performanceFeedback');
        this.categoryBreakdown = document.getElementById('categoryBreakdown');
        this.resultsSection = document.getElementById('resultsSection');
        this.socialShare = document.getElementById('socialShare');
        this.progressBar = document.getElementById('progressBar');
        this.shareBtn = document.getElementById('shareBtn');
        this.refreshBtn = document.getElementById('refreshBtn');
        
        // Debug info
        console.log('TriviaApp initialized');
        console.log('Submit button element:', this.submitButton);
        
        // Initialize the app
        this.init();
    }
    
    init() {
        // Load questions data
        this.loadQuestions();
        
        // Setup event listeners for static elements
        this.setupStaticEventListeners();
        
        // Render the quiz
        this.renderQuiz();
        
        // Check for existing attempts
        this.checkExistingAttempts();
        
        // Enable submit button immediately for testing
        if (this.submitButton) {
            this.submitButton.disabled = false;
            console.log('Submit button enabled (debug mode)');
        }
    }
    
    loadQuestions() {
        if (typeof QUESTIONS === 'undefined') {
            console.error('QUESTIONS not defined - check if questions.js is loaded');
            return;
        }
        
        this.questions = QUESTIONS;
        this.totalQuestions = Object.values(this.questions).reduce((total, category) => total + category.length, 0);
        console.log(`Loaded ${this.totalQuestions} total questions`);
    }
    
    setupStaticEventListeners() {
        // Submit button - always enable for now to test functionality
        if (this.submitButton) {
            this.submitButton.addEventListener('click', (e) => {
                console.log('Submit button clicked');
                e.preventDefault();
                this.handleSubmit();
            });
        }
        
        if (this.retryButton) {
            this.retryButton.addEventListener('click', () => this.retryQuiz());
        }
        
        if (this.refreshBtn) {
            this.refreshBtn.addEventListener('click', () => this.refreshApp());
        }
        
        if (this.shareBtn) {
            this.shareBtn.addEventListener('click', () => this.showShareOptions());
        }
        
        // Share buttons
        const shareButtons = document.querySelectorAll('[data-platform]');
        shareButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleShare(e));
        });
    }
    
    renderQuiz() {
        if (!this.categoriesContainer) {
            console.error('Categories container not found');
            return;
        }
        
        // Clear existing content
        this.categoriesContainer.innerHTML = '';
        
        // Create categories
        const categories = [
            { key: 'badenPowell', title: 'Baden Powell', icon: 'images/3.png' },
            { key: 'libros', title: 'Libros', icon: 'images/2.png' },
            { key: 'tecnica', title: 'Técnica', icon: 'images/1.png' }
        ];
        
        categories.forEach(category => {
            const questions = this.questions[category.key] || [];
            if (questions.length === 0) return;
            
            const categoryElement = document.createElement('div');
            categoryElement.className = 'category-section';
            categoryElement.innerHTML = `
                <h2 class="category-title" style="background: url(${category.icon}); background-repeat: no-repeat; color: white;">
                    ${category.title}
                </h2>
                <div class="quiz-container" id="quiz-${category.key}">
                    <!-- Questions will be inserted here -->
                </div>
                <div class="results-container" id="results-${category.key}"></div>
            `;
            
            this.categoriesContainer.appendChild(categoryElement);
            
            // Render questions for this category
            this.renderCategoryQuestions(category.key, questions);
        });
        
        // Add event listeners to all radio buttons AFTER they're created
        setTimeout(() => {
            this.addAnswerEventListeners();
        }, 100);
    }
    
    renderCategoryQuestions(categoryKey, questions) {
        const container = document.getElementById(`quiz-${categoryKey}`);
        if (!container) {
            console.error(`Quiz container not found for category: ${categoryKey}`);
            return;
        }
        
        const questionsHtml = questions.map((question, index) => {
            const questionId = `question-${categoryKey}-${index}`;
            const answersHtml = Object.entries(question.answers).map(([key, value]) => `
                <label class="answer-option">
                    <input type="radio" name="${questionId}" value="${key}" data-category="${categoryKey}" data-index="${index}">
                    <span class="answer-content">
                        <span class="answer-letter">${key}</span>
                        <span class="answer-text">${value}</span>
                    </span>
                </label>
            `).join('');
            
            return `
                <div class="question-card" data-category="${categoryKey}" data-index="${index}">
                    <h3 class="question-text">${question.question}</h3>
                    <div class="answers-container">
                        ${answersHtml}
                    </div>
                    <div class="feedback" id="feedback-${questionId}" aria-live="polite"></div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = questionsHtml;
    }
    
    addAnswerEventListeners() {
        const radioButtons = document.querySelectorAll('input[type="radio"]');
        console.log(`Found ${radioButtons.length} radio buttons`);
        
        radioButtons.forEach(radio => {
            // Remove any existing listeners to prevent duplicates
            radio.removeEventListener('change', this.radioChangeHandler);
            radio.addEventListener('change', (e) => this.radioChangeHandler(e));
        });
        
        // Enable submit button immediately for testing
        if (this.submitButton) {
            this.submitButton.disabled = false;
        }
    }
    
    radioChangeHandler(e) {
        const radio = e.target;
        const questionId = radio.name;
        const answer = radio.value;
        const category = radio.dataset.category;
        const index = radio.dataset.index;
        
        console.log(`Answer selected: ${questionId} = ${answer}`);
        
        this.userAnswers.set(questionId, answer);
        this.updateProgress();
        
        // Always enable submit button when any answer is selected (for testing)
        if (this.submitButton) {
            this.submitButton.disabled = false;
        }
    }
    
    updateProgress() {
        if (!this.progressBar) return;
        
        const answeredCount = this.userAnswers.size;
        const percentage = Math.min(100, Math.round((answeredCount / this.totalQuestions) * 100));
        
        this.progressBar.style.width = `${percentage}%`;
        this.progressBar.setAttribute('aria-valuenow', percentage);
        
        console.log(`Progress: ${answeredCount}/${this.totalQuestions} (${percentage}%)`);
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
        
        console.log(`Current attempt: ${this.currentAttempt}/${this.maxAttempts}`);
    }
    
    async handleSubmit() {
        console.log('handleSubmit called');
        
        if (this.isProcessing) {
            console.log('Already processing');
            return;
        }
        
        this.isProcessing = true;
        if (this.submitButton) {
            this.submitButton.disabled = true;
            this.submitButton.textContent = 'Procesando...';
        }
        
        try {
            await this.delay(300);
            
            this.score = 0;
            this.clearPreviousFeedback();
            
            // Grade each category
            let categoryResults = {};
            Object.entries(this.questions).forEach(([categoryKey, questions]) => {
                const categoryScore = this.gradeCategory(categoryKey, questions);
                this.score += categoryScore;
                categoryResults[categoryKey] = { score: categoryScore, total: questions.length };
            });
            
            // Show results
            this.showResults(categoryResults);
            
            // Save attempt
            this.saveAttempt();
            
            // Enable sharing
            this.enableSharing();
            
            console.log(`Quiz completed! Score: ${this.score}/${this.totalQuestions}`);
            
        } catch (error) {
            console.error('Error processing quiz:', error);
            this.showError('Hubo un error al procesar tus respuestas. Por favor, intenta de nuevo.');
        } finally {
            this.isProcessing = false;
            if (this.submitButton) {
                this.submitButton.disabled = false;
                this.submitButton.textContent = 'Ver Resultados';
            }
        }
    }
    
    gradeCategory(categoryKey, questions) {
        let categoryScore = 0;
        
        questions.forEach((question, index) => {
            const questionId = `question-${categoryKey}-${index}`;
            const userAnswer = this.userAnswers.get(questionId);
            const isCorrect = userAnswer === question.correctAnswer;
            
            console.log(`Grading ${questionId}: user=${userAnswer}, correct=${question.correctAnswer}, result=${isCorrect}`);
            
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
    
    showResults(categoryResults) {
        if (this.resultsSection) {
            this.resultsSection.hidden = false;
        }
        
        if (this.finalScoreElement) {
            this.finalScoreElement.innerHTML = `
                <div class="score-display">
                    <span class="score-number">${this.score}</span>
                    <span class="score-text">de ${this.totalQuestions} posibles</span>
                </div>
                <div class="attempt-info">Intento ${this.currentAttempt} de ${this.maxAttempts}</div>
            `;
        }
        
        if (this.performanceFeedback) {
            let feedbackText = '';
            const percentage = (this.score / this.totalQuestions) * 100;
            
            if (percentage >= 80) {
                feedbackText = '¡Excelente trabajo! Eres un verdadero experto scout. 🏆';
            } else if (percentage >= 60) {
                feedbackText = '¡Muy bien! Tienes buenos conocimientos scout. 👍';
            } else if (percentage >= 40) {
                feedbackText = 'Bien hecho. Sigue aprendiendo sobre escultismo. 📚';
            } else {
                feedbackText = 'No te desanimes. ¡Sigue practicando y mejorarás! 💪';
            }
            
            this.performanceFeedback.textContent = feedbackText;
        }
        
        if (this.categoryBreakdown) {
            const categories = [
                { key: 'badenPowell', title: 'Baden Powell' },
                { key: 'libros', title: 'Libros' },
                { key: 'tecnica', title: 'Técnica' }
            ];
            
            const breakdownHtml = categories.map(cat => {
                const result = categoryResults[cat.key];
                if (!result) return '';
                return `<div class="category-result"><strong>${cat.title}:</strong> ${result.score}/${result.total}</div>`;
            }).join('');
            
            this.categoryBreakdown.innerHTML = breakdownHtml;
        }
        
        if (this.retryButton) {
            this.retryButton.hidden = false;
        }
    }
    
    enableSharing() {
        if (this.shareBtn) {
            this.shareBtn.disabled = false;
        }
    }
    
    showShareOptions() {
        if (this.socialShare) {
            this.socialShare.hidden = false;
        }
    }
    
    saveAttempt() {
        this.currentAttempt++;
        this.setCookie('trivia_attempts', this.currentAttempt.toString());
    }
    
    retryQuiz() {
        this.userAnswers.clear();
        this.renderQuiz();
        
        if (this.resultsSection) this.resultsSection.hidden = true;
        if (this.socialShare) this.socialShare.hidden = true;
        if (this.retryButton) this.retryButton.hidden = true;
        
        this.updateProgress();
    }
    
    refreshApp() {
        this.retryQuiz();
    }
    
    handleShare(e) {
        const platform = e.currentTarget.dataset.platform;
        const score = this.score;
        const total = this.totalQuestions;
        const baseUrl = 'https://jgomezr.github.io/Trivia/';
        
        let shareUrl = '';
        let shareText = `¡Obtuve ${score} de ${total} en Trivia Scout!`;
        
        switch (platform) {
            case 'whatsapp':
                shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + baseUrl)}`;
                break;
            case 'telegram':
                shareUrl = `https://t.me/share/url?url=${encodeURIComponent(baseUrl)}&text=${encodeURIComponent(shareText)}`;
                break;
            case 'copy':
                navigator.clipboard.writeText(`${shareText} ${baseUrl}`)
                    .then(() => this.showToast('¡Enlace copiado al portapapeles!'))
                    .catch(err => console.error('Error copying to clipboard:', err));
                return;
            default:
                return;
        }
        
        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }
    }
    
    showToast(message) {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    showError(message) {
        this.showToast(message);
    }
    
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
    console.log('DOM loaded, initializing TriviaApp');
    
    if (typeof QUESTIONS !== 'undefined') {
        new TriviaApp();
    } else {
        console.error('QUESTIONS not defined - make sure questions.js is loaded before trivia-app.js');
    }
});