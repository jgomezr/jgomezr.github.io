var myQuestions = [
	{
		question: "¿Cuél fue el nombre de bautizo de BP?",
		answers: {
			a: 'Robert Stephenson Smyth Powell',
			b: 'Robert Stephenson Smyth Baden-Powell',
			c: 'Robert Stephe Smyth Powell'
		},
		correctAnswer: 'a'
	},
	{
		question: "¿Cuál fue la primera escuela a la que asistió Baden Powell?",
		answers: {
			a: 'Charterhouse School',
			b: 'Rose Hill School',
			c: 'Harrow School'
		},
		correctAnswer: 'b'
	},{
		question: "¿En que año fue el primer Rover Moot Internacional en América Latina?",
		answers: {
			a: '2000',
			b: '1982',
			c: '2010'
		},
		correctAnswer: 'a'
	},{
		question: "¿Cuando se realizó el primer JOTA?",
		answers: {
			a: '1920',
			b: '1957',
			c: '1963'
		},
		correctAnswer: 'b'
	},{
		question: "¿Cuál fue el máximo adelanto Rover entre 1920-1930?",
		answers: {
			a: 'Scout del Rey',
			b: 'BP',
			c: 'Scout de la Reina'
		},
		correctAnswer: 'a'
	},{
		question: "¿En qué año se paso de llamar World Rover Moot a World Scout Moot al evento internacional de los Rovers?",
		answers: {
			a: '1982',
			b: '1961',
			c: '1990'
		},
		correctAnswer: 'c'
	},{
		question: "¿De donde proviene la oración Rover en América Latina?",
		answers: {
			a: 'Oración de Santo Tomás de Aquino',
			b: 'Oración a San Ignacio de Loyola',
			c: 'Oración a San Luis Rey'
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
