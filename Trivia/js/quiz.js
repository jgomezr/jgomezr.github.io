var myQuestions = [
	{
		question: "¿En que año nació Baden Powell?",
		answers: {
			a: '1957',
			b: '1857',
			c: '1941'
		},
		correctAnswer: 'b'
	},
	{
		question: "¿Dónde murió Baden Powell?",
		answers: {
			a: 'Londres, Inglaterra',
			b: 'Mafeking, Sur Africa',
			c: 'Nyeri, Kenia'
		},
		correctAnswer: 'c'
	},{
		question: "¿Quién fue el primer Comisionado Rover?",
		answers: {
			a: 'Ulick de Burgh',
			b: 'El Príncipe Gustavo Adolfo de Suecia',
			c: 'William Henry Smyth'
		},
		correctAnswer: 'a'
	},{
		question: "¿Cuando fue publicado el libro Roverismo hacia el éxito?",
		answers: {
			a: '1918',
			b: '1922',
			c: '1908'
		},
		correctAnswer: 'b'
	},{
		question: "¿Cuál fue el primer libro Rover?",
		answers: {
			a: 'Roverismo hacia el éxito',
			b: 'Reglamento de los Rovers',
			c: 'Notas para el adiestramiento de los Rovers'
		},
		correctAnswer: 'b'
	},{
		question: "¿En qué año se realizó el primer Rover Moot?",
		answers: {
			a: '1908',
			b: '1920',
			c: '1931'
		},
		correctAnswer: 'c'
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