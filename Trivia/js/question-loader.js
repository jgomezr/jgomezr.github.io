/**
 * Question Loader - Loads questions from JSON file using fetch API
 */
class QuestionLoader {
    static async loadQuestions() {
        try {
            const response = await fetch('data/questions.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const questionsData = await response.json();
            return questionsData;
        } catch (error) {
            console.error('Failed to load questions:', error);
            // Fallback to hardcoded questions if JSON fails
            return this.getFallbackQuestions();
        }
    }
    
    static getFallbackQuestions() {
        // Fallback questions in case JSON loading fails
        return {
            badenPowell: [
                {
                    question: "¿Cuál era el nombre del territorio donde Baden Powell se enfrentó con los Ashanti?",
                    answers: { a: 'Sudafrica', b: 'Sudan', c: 'Costa de oro' },
                    correctAnswer: 'c',
                    difficulty: 'medium'
                },
                {
                    question: "¿Cuál fue uno de los eventos que hizo que Baden Powell pensara en la importancia del adiestramiento de los jóvenes?",
                    answers: { a: 'Una inspección a la Brigada de muchachos', b: 'Un desfile de la policía sudanesa', c: 'Una visita a Estados Unidos' },
                    correctAnswer: 'a',
                    difficulty: 'medium'
                }
            ],
            libros: [
                {
                    question: "El Scout jamás deberá recibir recompensas por haber prestado ayuda o haber sido cortés ¿A qué se refería Baden Powell con esta frase?",
                    answers: { a: 'a la buena acción', b: 'al servicio', c: 'al desinterés' },
                    correctAnswer: 'c',
                    difficulty: 'medium'
                },
                {
                    question: "Convertirte en Scout eficiente y capaz no es solamente para que goces y corras aventuras, sino para que seas útil a tu país y pueda servir a los semejantes ¿A qué se refería Baden Powell con esta frase de Escultimos para muchachos?",
                    answers: { a: 'Al servicio', b: 'Al objetivo del Escultismo', c: 'A la buena acción' },
                    correctAnswer: 'b',
                    difficulty: 'medium'
                }
            ],
            tecnica: [
                {
                    question: "En señales con silbato, ¿qué letra del alfabeto morse se usa para indicar rompan filas?",
                    answers: { a: 'M', b: 'B', c: 'T' },
                    correctAnswer: 'b',
                    difficulty: 'medium'
                },
                {
                    question: "¿Qué características deben tener las banderas para clave semáforo?",
                    answers: { a: 'Están divididas diagonalmente en dos partes', b: 'Se usan dos banderas', c: 'Qué sean de papel' },
                    correctAnswer: 'a',
                    difficulty: 'medium'
                }
            ]
        };
    }
}