'use strict';

var Alexa = require('alexa-sdk');



exports.handler = function(event, context, callback){
    var alexa = Alexa.handler(event, context, callback);
    alexa.dynamoDBTableName = 'JeopardyArchive';
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {

  // Open Jeopardy Archive
  'LaunchRequest': function() {
    // First time
		if (Object.keys(this.attributes).length === 0) {
      this.attributes.flashcards = {
        'numberCorrect': 0,
        'currentFlashcardIndex': 0
      };
      var CURRENTINDEX = this.attributes.flashcards.currentFlashcardIndex;
      var CURRENTQUESTION = flashcardsDictionary[CURRENTINDEX].question
      this.response.speak('Welcome to Jeopardy Archive. Here\'s your first question. ' + CURRENTQUESTION);
    } 
    
    // No more questions
    else if (this.attributes.flashcards.currentFlashcardIndex >= DECK_LENGTH) {
      this.response.speak('Welcome to Jeopardy Archive. You have answered all our questions. Say, reset, if you would like to reset the game.').listen('Say, reset, if you would like to reset the game.');
    }

    
    // Otherwise (happy path)
    else {
      var CURRENTINDEX = this.attributes.flashcards.currentFlashcardIndex;
      var QUESTIONNUMBER = CURRENTINDEX + 1;
      var NUMBERCORRECT = this.attributes.flashcards.numberCorrect;
      var PERCENTCORRECT = 0 + '%';
      if (CURRENTINDEX != 0) {
        PERCENTCORRECT = ((NUMBERCORRECT / CURRENTINDEX)*100).toFixed(0) + '%';
      }
      var CURRENTQUESTION = flashcardsDictionary[CURRENTINDEX].question
      this.response.speak('Welcome back to Jeopardy Archive. You are currently on question ' + QUESTIONNUMBER + ' and have so far answered ' + PERCENTCORRECT + ' correctly. Here\'s your next question. ' + CURRENTQUESTION);
    }

    this.emit(':responseReady');
  
  },

  // User gives an answer
  'AnswerIntent': function() {
    var NEXTINDEX = this.attributes.flashcards.currentFlashcardIndex+1;
    // Still questions remaining
    if (NEXTINDEX <= DECK_LENGTH) {
      var CURRENTINDEX = this.attributes.flashcards.currentFlashcardIndex;
      var NUMBERCORRECT = this.attributes.flashcards.numberCorrect;
      var userAnswer = this.event.request.intent.slots.answer.value.toLowerCase();
      var correctAnswer = flashcardsDictionary[CURRENTINDEX].answer.toLowerCase();
      this.attributes.flashcards.currentFlashcardIndex++;
      
      if (NEXTINDEX < DECK_LENGTH) {
        var NEXTQUESTION = flashcardsDictionary[NEXTINDEX].question;
        if (userAnswer == correctAnswer) {
          this.attributes.flashcards.numberCorrect++;
          this.response.speak('Correct! Let\'s try another question. ' + NEXTQUESTION);
        } else {
          console.log(userAnswer);
          console.log(correctAnswer);
          this.response.speak('Sorry! That\'s incorrect. The correct answer is ' + correctAnswer +'. Let\'s try another question. ' + NEXTQUESTION);
        }
      } 
    
      // No questions remaining
      else {
        if (userAnswer == correctAnswer) {
          this.attributes.flashcards.numberCorrect++;
          this.response.speak('Correct! You have answered all our questions. Say, reset, if you would like to reset the game.');
        } else {
          this.response.speak('Sorry! That\'s incorrect. The correct answer is ' + correctAnswer +'. You have answered all our questions. Say, reset, if you would like to reset the game.');
        }
      }
    } else {
      this.response.speak('You have answered all our questions. Say, reset, if you would like to reset the game.');
    }
    
    
    this.emit(':responseReady');
  },
  
  'ResetIntent': function() {
    this.attributes.flashcards.currentFlashcardIndex = 0;
    this.attributes.flashcards.numberCorrect = 0;
    var CURRENTINDEX = this.attributes.flashcards.currentFlashcardIndex;
    var CURRENTQUESTION = flashcardsDictionary[CURRENTINDEX].question
    this.response.speak('Resetting your game. OK, here\'s your first question. ' + CURRENTQUESTION);
    this.emit(':responseReady');
  },
  
  
   // Ask a question (no user input)
  'askQuestion': function() {
    var currentFlashcardIndex = this.attributes.flashcards.currentFlashcardIndex;
    var currentQuestion = flashcardsDictionary[currentFlashcardIndex].question;
	
    this.response.speak(currentQuestion);
    this.emit(':responseReady');
  },

  // Stop
  'AMAZON.StopIntent': function() {
      this.response.speak('Ok, let\'s play again soon.');
      this.emit(':responseReady');
  },

  // Cancel
  'AMAZON.CancelIntent': function() {
      this.response.speak('Ok, let\'s play again soon.');
      this.emit(':responseReady');
  },

  // Save state
  'SessionEndedRequest': function() {
    console.log('session ended!');
    this.emit(':saveState', true);
  }

};

function S3read(params, callback) {
    // call AWS S3
    var AWS = require('aws-sdk');
    var s3 = new AWS.S3();

    s3.getObject(params, function(err, data) {
        if(err) { console.log(err, err.stack); }
        else {

            var fileText = data.Body.toString();  // this is the complete file contents

            callback(fileText);
        }
    });
}

var flashcardsDictionary = [{"category": "HISTORY", "air_date": "2004-12-31", "question": "'For the last 8 years of his life, Galileo was under house arrest for espousing this man's theory'", "value": "$200", "answer": "Copernicus", "round": "Jeopardy!", "show_number": "4680"}, {"category": "ESPN's TOP 10 ALL-TIME ATHLETES", "air_date": "2004-12-31", "question": "'No. 2: 1912 Olympian; football star at Carlisle Indian School; 6 MLB seasons with the Reds, Giants & Braves'", "value": "$200", "answer": "Jim Thorpe", "round": "Jeopardy!", "show_number": "4680"}, {"category": "EVERYBODY TALKS ABOUT IT...", "air_date": "2004-12-31", "question": "'The city of Yuma in this state has a record average of 4,055 hours of sunshine each year'", "value": "$200", "answer": "Arizona", "round": "Jeopardy!", "show_number": "4680"}, {"category": "THE COMPANY LINE", "air_date": "2004-12-31", "question": "'In 1963, live on \"The Art Linkletter Show\", this company served its billionth burger'", "value": "$200", "answer": "McDonald\\'s", "round": "Jeopardy!", "show_number": "4680"}, {"category": "EPITAPHS & TRIBUTES", "air_date": "2004-12-31", "question": "'Signer of the Dec. of Indep., framer of the Constitution of Mass., second President of the United States'", "value": "$200", "answer": "John Adams", "round": "Jeopardy!", "show_number": "4680"}, {"category": "3-LETTER WORDS", "air_date": "2004-12-31", "question": "'In the title of an Aesop fable, this insect shared billing with a grasshopper'", "value": "$200", "answer": "the ant", "round": "Jeopardy!", "show_number": "4680"}, {"category": "HISTORY", "air_date": "2004-12-31", "question": "'Built in 312 B.C. to link Rome & the South of Italy, it's still in use today'", "value": "$400", "answer": "the Appian Way", "round": "Jeopardy!", "show_number": "4680"}, {"category": "ESPN's TOP 10 ALL-TIME ATHLETES", "air_date": "2004-12-31", "question": "'No. 8: 30 steals for the Birmingham Barons; 2,306 steals for the Bulls'", "value": "$400", "answer": "Michael Jordan", "round": "Jeopardy!", "show_number": "4680"}, {"category": "EVERYBODY TALKS ABOUT IT...", "air_date": "2004-12-31", "question": "'In the winter of 1971-72, a record 1,122 inches of snow fell at Rainier Paradise Ranger Station in this state'", "value": "$400", "answer": "Washington", "round": "Jeopardy!", "show_number": "4680"}, {"category": "THE COMPANY LINE", "air_date": "2004-12-31", "question": "'This housewares store was named for the packaging its merchandise came in & was first displayed on'", "value": "$400", "answer": "Crate & Barrel", "round": "Jeopardy!", "show_number": "4680"}, {"category": "EPITAPHS & TRIBUTES", "air_date": "2004-12-31", "question": "'\"And away we go\"'", "value": "$400", "answer": "Jackie Gleason", "round": "Jeopardy!", "show_number": "4680"}, {"category": "3-LETTER WORDS", "air_date": "2004-12-31", "question": "'Cows regurgitate this from the first stomach to the mouth & chew it again'", "value": "$400", "answer": "the cud", "round": "Jeopardy!", "show_number": "4680"}, {"category": "HISTORY", "air_date": "2004-12-31", "question": "'In 1000 Rajaraja I of the Cholas battled to take this Indian Ocean island now known for its tea'", "value": "$600", "answer": "Ceylon (or Sri Lanka)", "round": "Jeopardy!", "show_number": "4680"}, {"category": "ESPN's TOP 10 ALL-TIME ATHLETES", "air_date": "2004-12-31", "question": "'No. 1: Lettered in hoops, football & lacrosse at Syracuse & if you think he couldn't act, ask his 11 \"unclean\" buddies'", "value": "$600", "answer": "Jim Brown", "round": "Jeopardy!", "show_number": "4680"}, {"category": "EVERYBODY TALKS ABOUT IT...", "air_date": "2004-12-31", "question": "'On June 28, 1994 the nat'l weather service began issuing this index that rates the intensity of the sun's radiation'", "value": "$600", "answer": "the UV index", "round": "Jeopardy!", "show_number": "4680"}, {"category": "THE COMPANY LINE", "air_date": "2004-12-31", "question": "'This company's Accutron watch, introduced in 1960, had a guarantee of accuracy to within one minute a  month'", "value": "$600", "answer": "Bulova", "round": "Jeopardy!", "show_number": "4680"}, {"category": "EPITAPHS & TRIBUTES", "air_date": "2004-12-31", "question": "'Outlaw: \"Murdered by a traitor and a coward whose name is not worthy to appear here\"'", "value": "$600", "answer": "Jesse James", "round": "Jeopardy!", "show_number": "4680"}, {"category": "3-LETTER WORDS", "air_date": "2004-12-31", "question": "'A small demon, or a mischievous child (who might be a little demon!)'", "value": "$600", "answer": "imp", "round": "Jeopardy!", "show_number": "4680"}, {"category": "HISTORY", "air_date": "2004-12-31", "question": "'Karl led the first of these Marxist organizational efforts; the second one began in 1889'", "value": "$800", "answer": "the International", "round": "Jeopardy!", "show_number": "4680"}, {"category": "ESPN's TOP 10 ALL-TIME ATHLETES", "air_date": "2004-12-31", "question": "'No. 10: FB/LB for Columbia U. in the 1920s; MVP for the Yankees in '27 & '36; \"Gibraltar in Cleats\"'", "value": "$800", "answer": "(Lou) Gehrig", "round": "Jeopardy!", "show_number": "4680"}, {"category": "EVERYBODY TALKS ABOUT IT...", "air_date": "2004-12-31", "question": "'Africa's lowest temperature was 11 degrees below zero in 1935 at Ifrane, just south of Fez in this country'", "value": "$800", "answer": "Morocco", "round": "Jeopardy!", "show_number": "4680"}, {"category": "THE COMPANY LINE", "air_date": "2004-12-31", "question": "'Edward Teller & this man partnered in 1898 to sell high fashions to women'", "value": "$800", "answer": "(Paul) Bonwit", "round": "Jeopardy!", "show_number": "4680"}, {"category": "EPITAPHS & TRIBUTES", "air_date": "2004-12-31", "question": "'1939 Oscar winner: \"...you are a credit to your craft, your race and to your family\"'", "value": "$2,000", "answer": "Hattie McDaniel (for her role in Gone with the Wind)", "round": "Jeopardy!", "show_number": "4680"}, {"category": "3-LETTER WORDS", "air_date": "2004-12-31", "question": "'In geologic time one of these, shorter than an eon, is divided into periods & subdivided into epochs'", "value": "$800", "answer": "era", "round": "Jeopardy!", "show_number": "4680"}];
  
var DECK_LENGTH = flashcardsDictionary.length;

