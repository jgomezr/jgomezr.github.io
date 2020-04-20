// síempre que se cambien las preguntas hay que cambiar la versión
var version = "v7";
var bp = [
	{
		question: "¿En qué año se retiró Baden Powell del ejército?",
		answers: {
			a: '1920',
			b: '1910',
			c: '1912'
		},
		correctAnswer: 'b'
	},
	{
		question: "¿En qué año Baden Powell se retiró del Movimiento Scout?",
		answers: {
			a: '1941',
			b: '1937',
			c: '1930'
		},
		correctAnswer: 'b'
	}
];
var libros = [
	{
		question: "¿En qué año fue publicado el libro Lecciones de la universidad de la vida?",
		answers: {
			a: '1933',
			b: '1929',
			c: '1934'
		},
		correctAnswer: 'a'
	},{
		question: "¿En qué año fue publicado el libro Escultismo y movimientos juveniles?",
		answers: {
			a: '1920',
			b: '1933',
			c: '1929'
		},
		correctAnswer: 'c'
	}
];
var tecnica = [
	{
		question: "En señales con silbato, ¿qué letra del alfabeto morse se usa para indicar atención?",
		answers: {
			a: 'M',
			b: 'A',
			c: 'T'
		},
		correctAnswer: 'c'
	},{
		question: "¿Cuál amarre se usa para unir maderos en un ángulo distinto al ángulo recto?",
		answers: {
			a: 'Diagonal',
			b: 'Redondo',
			c: 'Paralelo'
		},
		correctAnswer: 'a'
	},{
		question: "¿Qué nudo se usa para ajustar los vientos de una carpa?",
		answers: {
			a: 'Tirante',
			b: 'Vuelta escota',
			c: 'Cote doble'
		},
		correctAnswer: 'a'
	}
];

var quizContainer = document.getElementById('quiz');
var resultsContainer = document.getElementById('results');
var quizContainer2 = document.getElementById('quiz2');
var resultsContainer2 = document.getElementById('results2');
var quizContainer3 = document.getElementById('quiz3');
var resultsContainer3 = document.getElementById('results3');
var resultFinal = document.getElementById('resultFinal');
var submitButton = document.getElementById('submit');
var puntajeFinal = 0;
var totalPreguntas = 0;
var intentos = 1;

generateQuiz(bp, libros, tecnica, quizContainer,  quizContainer2, quizContainer3, resultsContainer, resultsContainer2, resultsContainer3, submitButton);

function generateQuiz(questions, questions2, questions3, quizContainer,quizContainer2, quizContainer3, resultsContainer, resultsContainer2, resultsContainer3, submitButton){
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

	function showQuestions2(questions2, quizContainer2){
		// we'll need a place to store the output and the answer choices
		var output = [];
		var answers;

		// for each question...
		for(var i=0; i<questions2.length; i++){
			
			// first reset the list of answers
			answers = [];

			// for each available answer...
			for(letter in questions2[i].answers){

				// ...add an html radio button
				answers.push(
					'<label>'
						+ '<input type="radio" name="question2'+i+'" value="'+letter+'">'
						+ letter + ': '
						+ questions2[i].answers[letter]
					+ '</label>'
				);
			}

			// add this question and its answers to the output
			output.push(
				'<div class="question">' + questions2[i].question + '</div>'
				+ '<div class="answers">' + answers.join('') + '</div>'
			);
		}

		// finally combine our output list into one string of html and put it on the page
		quizContainer2.innerHTML = output.join('');
	}

	function showQuestions3(questions3, quizContainer3){
		// we'll need a place to store the output and the answer choices
		var output = [];
		var answers;

		// for each question...
		for(var i=0; i<questions3.length; i++){
			
			// first reset the list of answers
			answers = [];

			// for each available answer...
			for(letter in questions3[i].answers){

				// ...add an html radio button
				answers.push(
					'<label>'
						+ '<input type="radio" name="question3'+i+'" value="'+letter+'">'
						+ letter + ': '
						+ questions3[i].answers[letter]
					+ '</label>'
				);
			}

			// add this question and its answers to the output
			output.push(
				'<div class="question">' + questions3[i].question + '</div>'
				+ '<div class="answers">' + answers.join('') + '</div>'
			);
		}

		// finally combine our output list into one string of html and put it on the page
		quizContainer3.innerHTML = output.join('');
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
				answerContainers[i].style.color = 'green';
			}else{
				// color the answers red
				answerContainers[i].style.color = 'red';
			}
		}

		// show number of correct answers out of total
		resultsContainer.innerHTML = numCorrect + ' de ' + questions.length;
		puntajeFinal = puntajeFinal+numCorrect;
		totalPreguntas = totalPreguntas+questions.length;
	}

	function showResults2(questions2, quizContainer2, resultsContainer2){
		
		// gather answer containers from our quiz
		var answerContainers2 = quizContainer2.querySelectorAll('.answers');
		
		// keep track of user's answers
		var userAnswer2 = '';
		var numCorrect2 = 0;
		
		// for each question...
		for(var i=0; i<questions2.length; i++){

			// find selected answer
			userAnswer2 = (answerContainers2[i].querySelector('input[name=question2'+i+']:checked')||{}).value;
			
			// if answer is correct
			if(userAnswer2===questions2[i].correctAnswer){
				// add to the number of correct answers
				numCorrect2++;
				
				// color the answers green
				answerContainers2[i].style.color = 'green';
			}
			// if answer is wrong or blank
			else{
				// color the answers red
				answerContainers2[i].style.color = 'red';
			}
		}

		// show number of correct answers out of total
		resultsContainer2.innerHTML = numCorrect2 + ' de ' + questions2.length;
		puntajeFinal = puntajeFinal+numCorrect2;
		totalPreguntas = totalPreguntas+questions2.length;
	}

	function showResults3(questions3, quizContainer3, resultsContainer3){
		
		// gather answer containers from our quiz
		var answerContainers3 = quizContainer3.querySelectorAll('.answers');
		
		// keep track of user's answers
		var userAnswer3 = '';
		var numCorrect3 = 0;
		
		// for each question...
		for(var i=0; i<questions3.length; i++){

			// find selected answer
			userAnswer3 = (answerContainers3[i].querySelector('input[name=question3'+i+']:checked')||{}).value;
			
			// if answer is correct
			if(userAnswer3===questions3[i].correctAnswer){
				// add to the number of correct answers
				numCorrect3++;
				
				// color the answers green
				answerContainers3[i].style.color = 'green';
			}
			// if answer is wrong or blank
			else{
				// color the answers red
				answerContainers3[i].style.color = 'red';
			}
		}

		// show number of correct answers out of total
		resultsContainer3.innerHTML = numCorrect3 + ' de ' + questions3.length;
		puntajeFinal = puntajeFinal+numCorrect3;
		totalPreguntas = totalPreguntas+questions3.length;
	}

	// show questions right away
	showQuestions(questions, quizContainer);
	showQuestions2(questions2, quizContainer2);
	showQuestions3(questions3, quizContainer3);
	
	// on submit, show results
	submitButton.onclick = function(){
		puntajeFinal =0;
		totalPreguntas =0;
		var x = getCookie("version");
		if (version === x) {
			intentos ++;
		}else{
			document.cookie = "version="+version;
			intentos = 1;
		}
		showResults(questions, quizContainer, resultsContainer);
		showResults2(questions2, quizContainer2, resultsContainer2);
		showResults3(questions3, quizContainer3, resultsContainer3);
		resultFinal.innerHTML = puntajeFinal+' de '+totalPreguntas+' posibles en '+intentos+' intentos';
		if (intentos >=3) {
			submitButton.style.display = "none"
		}else{
			submitButton.style.display = "block"
		}
		
		console.log('version '+x);
	}

	function getCookie(cname) {
	  var name = cname + "=";
	  var ca = document.cookie.split(';');
	  for(var i = 0; i < ca.length; i++) {
	    var c = ca[i];
	    while (c.charAt(0) == ' ') {
	      c = c.substring(1);
	    }
	    if (c.indexOf(name) == 0) {
	      return c.substring(name.length, c.length);
	    }
	  }
	  return "";
	}
	
}
