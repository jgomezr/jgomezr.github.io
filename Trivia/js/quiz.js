var myQuestions = [
	{
		question: "¿Qué nudo se usa para iniciar un amarre cuadrado?",
		answers: {
			a: 'Vuelta escota',
			b: 'Ballestrinque',
			c: 'Vuelta de rezón'
		},
		correctAnswer: 'b'
	},
	{
		question: "Si los largueros en los que voy a aplicar un amarre forman un angulo de 90° ¿Qué amarre debo usar?",
		answers: {
			a: 'Cuadrado',
			b: 'Diagonal',
			c: 'Ninguno'
		},
		correctAnswer: 'a'
	},{
		question: "¿Qué tipo de fogata me permite ir acercando los troncos al centro a medida que se consume?",
		answers: {
			a: 'Tipo tipi',
			b: 'Tipo estrella',
			c: 'Tipo polinesio'
		},
		correctAnswer: 'b'
	},{
		question: "¿Cuál es desventaja de la fogata tipo corredor?",
		answers: {
			a: 'Que no se puede correr',
			b: 'No tiene desventaja',
			c: 'Solo se puede usar cuando la dirección del viento es fija'
		},
		correctAnswer: 'c'
	},{
		question: "¿En nudos a que se llama Chicote?",
		answers: {
			a: 'Al extremo de un cabo',
			b: 'A una curvatura de un cabo',
			c: 'A un cabo con diametro superior a 10 mm'
		},
		correctAnswer: 'a'
	}
];

var quizContainer = document.getElementById('quiz');
var resultsContainer = document.getElementById('results');
var submitButton = document.getElementById('submit');

generateQuiz(myQuestions, quizContainer, resultsContainer, submitButton);

function generateQuiz(questions, quizContainer, resultsContainer, submitButton){

	function showQuestions(questions, quizContainer){
		// we'll need a place to store the output and the answer choices
		var output = [];
		var answers;

		// for each question...
		for(var i=0; i<questions.length; i++){
			
			// first reset the list of answers
			answers = [];

			// for each available answer...
			for(letter in questions[i].answers){

				// ...add an html radio button
				answers.push(
					'<label>'
						+ '<input type="radio" name="question'+i+'" value="'+letter+'">'
						+ letter + ': '
						+ questions[i].answers[letter]
					+ '</label>'
				);
			}

			// add this question and its answers to the output
			output.push(
				'<div class="question">' + questions[i].question + '</div>'
				+ '<div class="answers">' + answers.join('') + '</div>'
			);
		}

		// finally combine our output list into one string of html and put it on the page
		quizContainer.innerHTML = output.join('');
	}


	function showResults(questions, quizContainer, resultsContainer){
		
		// gather answer containers from our quiz
		var answerContainers = quizContainer.querySelectorAll('.answers');
		
		// keep track of user's answers
		var userAnswer = '';
		var numCorrect = 0;
		
		// for each question...
		for(var i=0; i<questions.length; i++){

			// find selected answer
			userAnswer = (answerContainers[i].querySelector('input[name=question'+i+']:checked')||{}).value;
			
			// if answer is correct
			if(userAnswer===questions[i].correctAnswer){
				// add to the number of correct answers
				numCorrect++;
				
				// color the answers green
				answerContainers[i].style.color = 'lightgreen';
			}
			// if answer is wrong or blank
			else{
				// color the answers red
				answerContainers[i].style.color = 'red';
			}
		}

		// show number of correct answers out of total
		resultsContainer.innerHTML = numCorrect + ' de ' + questions.length;
	}

	// show questions right away
	showQuestions(questions, quizContainer);
	
	// on submit, show results
	submitButton.onclick = function(){
		showResults(questions, quizContainer, resultsContainer);
	}

}
