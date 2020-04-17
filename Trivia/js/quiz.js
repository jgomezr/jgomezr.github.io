// síempre que se cambien las preguntas hay que cambiar la versión
var version = "v5";
var bp = [
	{
		question: "¿En que año fue enviado por primera vez Baden Powell a Africa?",
		answers: {
			a: '1880',
			b: '1876',
			c: '1857'
		},
		correctAnswer: 'a'
	},
	{
		question: "¿Por qué Mafeking obtubo tanta atención?",
		answers: {
			a: 'Por que era un punto estratégico',
			b: 'Por que el hijo del Primer Ministro Británico estaba allí',
			c: 'Por que era muy bonita'
		},
		correctAnswer: 'b'
	}
];
var libros = [
	{
		question: "¿Por qué es importante para el roverismo el texto Notas para el adistramiento rover?",
		answers: {
			a: 'Por que da lineamientos sobre la edad de los rovers',
			b: 'Por que muestra la línea de ascenso rover',
			c: 'Por que era el único texto rover'
		},
		correctAnswer: 'a'
	},{
		question: "¿En qué año fue publicado el Manual para lobatos?",
		answers: {
			a: '1908',
			b: '1916',
			c: '1928'
		},
		correctAnswer: 'b'
	}
];
var tecnica = [
	{
		question: "¿Comó deben ir orientadas las puertas de las carpas?",
		answers: {
			a: 'Hacia el rio',
			b: 'En sentido contrario a donde esté el viento',
			c: 'Hacia donde este la comida'
		},
		correctAnswer: 'b'
	},{
		question: "¿Cuál nudo de los básicos sirve para unir cuerdas de diferente calibre?",
		answers: {
			a: 'Llano o riso',
			b: 'Vuelta escota',
			c: 'Pescador'
		},
		correctAnswer: 'b'
	},{
		question: "¿Para qué tipo de fogata es necesario crear una especie de pared?",
		answers: {
			a: 'Tipo cazador',
			b: 'Tipo Polinesio',
			c: 'Tipo reflector'
		},
		correctAnswer: 'c'
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
