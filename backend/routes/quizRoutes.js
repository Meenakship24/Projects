const express = require('express');
const router = express.Router();
const Quiz = require('../models/quiz');
console.log(Quiz);
// Route to get all quiz questions
router.get('/questions', async (req, res) => {
  try {
    const questions = await Quiz.find(); // Fetch questions from MongoDB
    console.log(questions);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quiz questions' });
  }
});

// Route to add a quiz question
router.post('/questions', async (req, res) => {
  try {
    const newQuestion = new Quiz(req.body);
    await newQuestion.save();
    res.status(201).json(newQuestion);
  } catch (error) {
    res.status(400).json({ error: 'Failed to add quiz question' });
  }
});

module.exports = router;



// const express = require('express');
// const router = express.Router();
// const { getQuestions, submitQuiz } = require('../Controllers/quizController');

// router.get('/questions', getQuestions);
// router.post('/submit', submitQuiz);

// module.exports = router;
