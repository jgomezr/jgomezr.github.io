// Trivia App Questions Data
// Version management for question updates
const TRIVIA_VERSION = "v10";

// Expanded question bank with more categories and questions
const QUESTIONS = {
  badenPowell: [
    {
      question: "¿Cuál era el nombre del territorio donde Baden Powell se enfrentó con los Ashanti?",
      answers: {
        a: 'Sudafrica',
        b: 'Sudan', 
        c: 'Costa de oro'
      },
      correctAnswer: 'c',
      difficulty: 'medium',
      explanation: "Baden Powell sirvió en la Costa de Oro (actual Ghana) donde tuvo su primer encuentro con los Ashanti."
    },
    {
      question: "¿Cuál fue uno de los eventos que hizo que Baden Powell pensara en la importancia del adiestramiento de los jóvenes?",
      answers: {
        a: 'Una inspección a la Brigada de muchachos',
        b: 'Un desfile de la policía sudanesa',
        c: 'Una visita a Estados Unidos'
      },
      correctAnswer: 'a',
      difficulty: 'medium',
      explanation: "La inspección a la Brigada de muchachos en 1907 fue fundamental para desarrollar sus ideas sobre el escultismo."
    },
    {
      question: "¿En qué año se publicó 'Scouting for Boys' por primera vez?",
      answers: {
        a: '1907',
        b: '1908', 
        c: '1910'
      },
      correctAnswer: 'b',
      difficulty: 'easy',
      explanation: "'Scouting for Boys' se publicó originalmente en 1908 como una serie de fascículos semanales."
    },
    {
      question: "¿Qué rango militar tenía Baden Powell cuando fundó el movimiento scout?",
      answers: {
        a: 'Teniente Coronel',
        b: 'General',
        c: 'Coronel'
      },
      correctAnswer: 'b',
      difficulty: 'hard',
      explanation: "Baden Powell alcanzó el rango de General en el ejército británico."
    }
  ],
  libros: [
    {
      question: "El Scout jamás deberá recibir recompensas por haber prestado ayuda o haber sido cortés ¿A qué se refería Baden Powell con esta frase?",
      answers: {
        a: 'a la buena acción',
        b: 'al servicio',
        c: 'al desinterés'
      },
      correctAnswer: 'c',
      difficulty: 'medium',
      explanation: "Esta frase se refiere al principio del desinterés, hacer el bien sin esperar recompensa."
    },
    {
      question: "Convertirte en Scout eficiente y capaz no es solamente para que goces y corras aventuras, sino para que seas útil a tu país y pueda servir a los semejantes ¿A qué se refería Baden Powell con esta frase de Escultimos para muchachos?",
      answers: {
        a: 'Al servicio',
        b: 'Al objetivo del Escultismo',
        c: 'A la buena acción'
      },
      correctAnswer: 'b',
      difficulty: 'medium',
      explanation: "Esta frase resume el objetivo fundamental del escultismo: formar ciudadanos útiles a la sociedad."
    },
    {
      question: "¿Cuál es el título original en inglés de 'Escultismo para Muchachos'?",
      answers: {
        a: 'Scout Guide',
        b: 'Boy Scouts Handbook',
        c: 'Scouting for Boys'
      },
      correctAnswer: 'c',
      difficulty: 'easy',
      explanation: "El título original es 'Scouting for Boys', publicado en 1908."
    },
    {
      question: "¿Qué otro libro importante escribió Baden Powell además de 'Scouting for Boys'?",
      answers: {
        a: 'Rovering to Success',
        b: 'The Scout Manual',
        c: 'Adventure Guide'
      },
      correctAnswer: 'a',
      difficulty: 'hard',
      explanation: "'Rovering to Success' fue escrito para scouts mayores (rovers) y publicado en 1922."
    }
  ],
  tecnica: [
    {
      question: "En señales con silbato, ¿qué letra del alfabeto morse se usa para indicar rompan filas?",
      answers: {
        a: 'M',
        b: 'B',
        c: 'T'
      },
      correctAnswer: 'b',
      difficulty: 'medium',
      explanation: "La letra 'B' en código morse (•–––) se usa para la señal de 'rompan filas'."
    },
    {
      question: "¿Qué características deben tener las banderas para clave semáforo?",
      answers: {
        a: 'Están divididas diagonalmente en dos partes',
        b: 'Se usan dos banderas',
        c: 'Qué sean de papel'
      },
      correctAnswer: 'a',
      difficulty: 'medium',
      explanation: "Las banderas de semáforo están divididas diagonalmente en dos colores, típicamente rojo y blanco."
    },
    {
      question: "¿Cuántos nudos básicos debe conocer todo scout según el método tradicional?",
      answers: {
        a: '5',
        b: '7',
        c: '10'
      },
      correctAnswer: 'b',
      difficulty: 'easy',
      explanation: "Tradicionalmente, se enseñan 7 nudos básicos: llano, vuelta de escota, as de guía, pescador, ballestrinque, margarita y vuelta de braza."
    },
    {
      question: "¿Qué significa la señal de socorro internacional 'SOS' en código morse?",
      answers: {
        a: 'Save Our Souls',
        b: 'No tiene significado literal, es solo una señal fácil de recordar',
        c: 'Send Our Signal'
      },
      correctAnswer: 'b',
      difficulty: 'hard',
      explanation: "'SOS' no significa nada en particular; fue elegido porque es fácil de recordar y transmitir en código morse (...---...)."
    }
  ]
};

// Function to get all questions for a category
function getQuestionsByCategory(category) {
  return QUESTIONS[category] || [];
}

// Function to get all questions combined
function getAllQuestions() {
  return Object.values(QUESTIONS).flat();
}

// Function to get questions by difficulty
function getQuestionsByDifficulty(difficulty) {
  return getAllQuestions().filter(q => q.difficulty === difficulty);
}