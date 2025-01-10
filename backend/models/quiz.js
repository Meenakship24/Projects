// models/quiz.js
const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  
  QueDescription: { type: String, required: true },
  QuestionId: Number,
  Options: { 
    type: Map, // Use Map for object-like structures
    of: String // Values are strings
  },
  Answer: { type: String, required: true },
  // correctAnswer: { type: String, required: true },
}, { collection: 'quiz' }); 

const Quiz = mongoose.model('quiz', quizSchema);

module.exports = Quiz;




// const mongoose = require('mongoose');

// const QuizSchema = new mongoose.Schema({
//   QuestionId: { type: Number, required: true },
//   QueDescription: { type: String, required: true },
//   Options: { type: Object, required: true },
//   Answer: { type: String, required: true },
// });

// module.exports = mongoose.model('Quiz', QuizSchema);
