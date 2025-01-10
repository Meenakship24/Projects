const Quiz = require('../models/quiz');
const User = require('../models/user');

// Get random quiz questions
exports.getQuestions = async (req, res) => {
  try {
    const questions = await Quiz.aggregate([{ $sample: { size: 25 } }]); // Fetch 25 random questions
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Submit quiz answers
exports.submitQuiz = async (req, res) => {
  const { userId, answers } = req.body;

  try {
    const user = await User.findById(userId);
    let totalScore = 0;

    for (let i = 0; i < answers.length; i++) {
      const question = await Quiz.findById(answers[i].questionId);
      const selectedOption = answers[i].selectedOption;
      const isCorrect = question.options.find(opt => opt.optionText === selectedOption && opt.isCorrect);

      user.attemptedQuestions.push({
        questionId: question._id,
        selectedOption,
        isCorrect: !!isCorrect
      });

      if (isCorrect) {
        totalScore++;
      }
    }

    user.totalScore = totalScore;
    await user.save();

    res.json({ message: 'Quiz submitted successfully', totalScore });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
