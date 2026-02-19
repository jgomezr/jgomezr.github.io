// Debug utilities for troubleshooting
window.TriviaDebug = {
    getAnsweredQuestions: function() {
        const app = window.triviaAppInstance;
        if (app) {
            return {
                answered: app.userAnswers.size,
                total: app.totalQuestions,
                answers: Object.fromEntries(app.userAnswers)
            };
        }
        return null;
    },
    
    enableSubmitButton: function() {
        const app = window.triviaAppInstance;
        if (app && app.submitButton) {
            app.submitButton.disabled = false;
            console.log('Submit button manually enabled');
        }
    },
    
    logAllRadioButtons: function() {
        const radios = document.querySelectorAll('input[type="radio"]');
        console.log('Total radio buttons:', radios.length);
        radios.forEach((radio, index) => {
            console.log(`Radio ${index}: name=${radio.name}, checked=${radio.checked}`);
        });
    }
};

// Make the app instance globally accessible for debugging
document.addEventListener('DOMContentLoaded', () => {
    if (typeof TriviaApp !== 'undefined') {
        window.triviaAppInstance = new TriviaApp();
    }
});