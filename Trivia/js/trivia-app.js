/**
 * Enhanced Trivia Scout App - FINAL VERSION
 * Modern, accessible, and feature-rich trivia application
 * Version: 3.0.0 (JSON questions + Instagram sharing)
 */

class TriviaApp {
    constructor() {
        this.version = "v11";
        this.currentAttempt = 1;
        this.maxAttempts = 3;
        this.score = 0;
        this.totalQuestions = 0;
        this.userAnswers = new Map();
        this.isProcessing = false;
        this.questions = null;
        
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
        this.instagramShareBtn = document.getElementById('instagramShareBtn');
        
        // Initialize the app
        this.init();
    }
    
    async init() {
        try {
            // Load questions from JSON
            this.questions = await QuestionLoader.loadQuestions();
            this.totalQuestions = Object.values(this.questions).reduce((total, category) => total + category.length, 0);
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Render the quiz
            this.renderQuiz();
            
            // Check for existing attempts
            this.checkExistingAttempts();
            
        } catch (error) {
            console.error('Failed to load questions:', error);
            this.showError('No se pudieron cargar las preguntas. Por favor, recarga la página.');
        }
    }
    
    setupEventListeners() {
        if (this.submitButton) {
            this.submitButton.addEventListener('click', () => this.handleSubmit());
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
        
        if (this.instagramShareBtn) {
            this.instagramShareBtn.addEventListener('click', () => this.generateInstagramImage());
        }
        
        // Share buttons
        const shareButtons = document.querySelectorAll('[data-platform]');
        shareButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleShare(e));
        });
    }
    
    renderQuiz() {
        if (!this.categoriesContainer || !this.questions) return;
        
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
        
        // Add event listeners to all radio buttons
        this.addAnswerEventListeners();
    }
    
    renderCategoryQuestions(categoryKey, questions) {
        const container = document.getElementById(`quiz-${categoryKey}`);
        if (!container) return;
        
        const questionsHtml = questions.map((question, index) => {
            const questionId = `${categoryKey}${index}`;
            const answersHtml = Object.entries(question.answers).map(([key, value]) => `
                <label class="answer-option">
                    <input type="radio" name="${questionId}" value="${key}">
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
        radioButtons.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const questionId = e.target.name;
                const answer = e.target.value;
                this.userAnswers.set(questionId, answer);
                this.updateProgress();
                this.checkEnableSubmit();
            });
        });
    }
    
    checkEnableSubmit() {
        // Enable submit button only when all questions are answered
        if (this.submitButton && this.userAnswers.size === this.totalQuestions) {
            this.submitButton.disabled = false;
        }
    }
    
    updateProgress() {
        if (!this.progressBar) return;
        
        const answeredCount = this.userAnswers.size;
        const percentage = Math.min(100, Math.round((answeredCount / this.totalQuestions) * 100));
        
        this.progressBar.style.width = `${percentage}%`;
        this.progressBar.setAttribute('aria-valuenow', percentage);
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
        
        // Update UI based on attempts
        this.updateAttemptUI();
    }
    
    updateAttemptUI() {
        // Hide submit button if max attempts reached
        if (this.submitButton && this.currentAttempt > this.maxAttempts) {
            this.submitButton.style.display = 'none';
        }
    }
    
    async handleSubmit() {
        if (this.isProcessing) return;
        if (this.currentAttempt >= this.maxAttempts) {
            this.showError('Has alcanzado el máximo de intentos (3). ¡Gracias por jugar!');
            return;
        }
        
        this.isProcessing = true;
        if (this.submitButton) {
            this.submitButton.disabled = true;
            this.submitButton.textContent = 'Procesando...';
        }
        
        try {
            await this.delay(300); // Small delay for UX
            
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
            const questionId = `${categoryKey}${index}`;
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
    
    showResults(categoryResults) {
        // Show results section
        if (this.resultsSection) {
            this.resultsSection.hidden = false;
        }
        
        // Update final score
        if (this.finalScoreElement) {
            this.finalScoreElement.innerHTML = `
                <div class="score-display">
                    <span class="score-number">${this.score}</span>
                    <span class="score-text">de ${this.totalQuestions} posibles</span>
                </div>
                <div class="attempt-info">Intento ${this.currentAttempt} de ${this.maxAttempts}</div>
            `;
        }
        
        // Update performance feedback
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
        
        // Update category breakdown
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
        
        // Show retry button
        if (this.retryButton) {
            this.retryButton.hidden = false;
        }
    }
    
    enableSharing() {
        if (this.shareBtn) {
            this.shareBtn.disabled = false;
        }
        if (this.instagramShareBtn) {
            this.instagramShareBtn.style.display = 'inline-block';
        }
    }
    
    showShareOptions() {
        if (this.socialShare) {
            this.socialShare.hidden = false;
        }
    }
    
    async generateInstagramImage() {
        try {
            const imageData = await ImageGenerator.generateScoreImage(
                this.score,
                this.totalQuestions,
                this.getUserName()
            );
            
            // Create download link
            const link = document.createElement('a');
            link.download = `trivia-scout-score-${this.score}-of-${this.totalQuestions}.png`;
            link.href = imageData;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showToast('¡Imagen generada! Abre tu galería para compartir en Instagram.');
            
        } catch (error) {
            console.error('Error generating image:', error);
            this.showError('No se pudo generar la imagen. Intenta de nuevo.');
        }
    }
    
    getUserName() {
        // You can customize this to get user's name from input or localStorage
        return 'Scout';
    }
    
    saveAttempt() {
        this.currentAttempt++;
        this.setCookie('trivia_attempts', this.currentAttempt.toString());
        this.updateAttemptUI();
    }
    
    retryQuiz() {
        // Clear user answers
        this.userAnswers.clear();
        
        // Re-render the quiz
        this.renderQuiz();
        
        // Hide results
        if (this.resultsSection) {
            this.resultsSection.hidden = true;
        }
        if (this.socialShare) {
            this.socialShare.hidden = true;
        }
        if (this.retryButton) {
            this.retryButton.hidden = true;
        }
        if (this.instagramShareBtn) {
            this.instagramShareBtn.style.display = 'none';
        }
        
        // Reset progress
        this.updateProgress();
        
        // Disable submit button
        if (this.submitButton) {
            this.submitButton.disabled = true;
        }
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