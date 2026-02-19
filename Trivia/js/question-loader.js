/**
 * Question Loader Module
 * Loads questions from JSON file and manages question sets
 */

class QuestionLoader {
    constructor() {
        this.questions = null;
        this.currentSet = 'default';
        this.loaded = false;
    }
    
    async loadQuestions(setName = 'default') {
        try {
            const response = await fetch('data/questions.json');
            if (!response.ok) {
                throw new Error(`Failed to load questions: ${response.status}`);
            }
            
            const data = await response.json();
            this.questions = data;
            this.currentSet = setName;
            this.loaded = true;
            
            console.log('Questions loaded successfully:', data);
            return this.getQuestionsForSet(setName);
            
        } catch (error) {
            console.error('Error loading questions:', error);
            // Fallback to hardcoded questions if JSON fails
            return this.getFallbackQuestions();
        }
    }
    
    getQuestionsForSet(setName) {
        if (!this.loaded || !this.questions) {
            return this.getFallbackQuestions();
        }
        
        const set = this.questions.sets[setName];
        if (!set) {
            console.warn(`Question set '${setName}' not found, using default`);
            return this.questions.sets.default || this.getFallbackQuestions();
        }
        
        return set;
    }
    
    getAllSets() {
        if (!this.loaded || !this.questions) {
            return ['default'];
        }
        return Object.keys(this.questions.sets);
    }
    
    getCurrentSetInfo() {
        if (!this.loaded || !this.questions) {
            return { name: 'default', description: 'Preguntas por defecto' };
        }
        return this.questions.sets[this.currentSet]?.info || 
               { name: this.currentSet, description: 'Conjunto de preguntas' };
    }
    
    getFallbackQuestions() {
        // Fallback questions in case JSON loading fails
        return {
            info: { name: 'Fallback', description: 'Preguntas de respaldo' },
            categories: {
                badenPowell: [
                    {
                        question: "¿Cuál era el nombre del territorio donde Baden Powell se enfrentó con los Ashanti?",
                        answers: { a: 'Sudafrica', b: 'Sudan', c: 'Costa de oro' },
                        correctAnswer: 'c'
                    }
                ],
                libros: [
                    {
                        question: "El Scout jamás deberá recibir recompensas por haber prestado ayuda...",
                        answers: { a: 'a la buena acción', b: 'al servicio', c: 'al desinterés' },
                        correctAnswer: 'c'
                    }
                ],
                tecnica: [
                    {
                        question: "En señales con silbato, ¿qué letra del alfabeto morse se usa para indicar rompan filas?",
                        answers: { a: 'M', b: 'B', c: 'T' },
                        correctAnswer: 'b'
                    }
                ]
            }
        };
    }
}

// Global instance for easy access
const questionLoader = new QuestionLoader();