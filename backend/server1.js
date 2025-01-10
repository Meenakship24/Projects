const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

// Models
const Quiz = require('./models/quiz');
const Result = require('./models/result');
const UserSession = require('./models/session');

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/Quiz_Module', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err));

// Start a Quiz Session
app.post('/start-quiz', async (req, res) => {
  const User_ID = req.body.User_ID || "1"; // Dynamic or default User_ID

  try {
    const sessionId = uuidv4();
    const questions = await Quiz.aggregate([
      { $sample: { size: 5 } },
      { $project: { QueDescription: 1, Options: 1, QuestionId: 1 } },
    ]);

    const session = new UserSession({
      SessionId: sessionId,
      User_Id: User_ID,
      QuestionId: questions.map((q) => q.QuestionId),
    });

    await session.save();
    res.status(201).json({ session, questions });
  } catch (error) {
    res.status(500).json({ message: `Failed to start quiz: ${error.message}` });
  }
});

// Submit the Quiz
app.post('/submit-quiz', async (req, res) => {
  const { SessionId, User_Id, Answers } = req.body;

  try {
    const session = await UserSession.findOne({ User_Id, SessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found for the user' });
    }

    const questionIds = Object.keys(Answers).map((id) => parseInt(id));
    const questions = await Quiz.find({ QuestionId: { $in: questionIds } });

    let score = 0;
    questions.forEach((question) => {
      if (Answers[question.QuestionId] === question.Answer) {
        score++;
      }
    });

    session.IsSubmitted = true;
    session.CurrentScore = score;
    session.Status = 'Completed';
    await session.save();

    const result = new Result({
      User_Id,
      Score: score,
      ContestId: SessionId,
      QuestionId: questionIds,
      Answers,
      IsAttempted: true,
      Attempted_at: new Date(),
    });

    await result.save();

    res.status(200).json({
      message: 'Quiz submitted successfully',
      result,
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ message: `Failed to submit quiz: ${error.message}` });
  }
});

// Get Quiz Questions
app.get('/quiz/questions', async (req, res) => {
  try {
    const questions = await Quiz.aggregate([
      { $sample: { size: 5 } },
      { $project: { QueDescription: 1, Options: 1, QuestionId: 1 } },
    ]);
    res.json(questions);
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    res.status(500).json({ error: 'Failed to fetch quiz questions' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
