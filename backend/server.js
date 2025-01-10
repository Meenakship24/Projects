// Required dependencies
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
// const axios=require('axios')
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

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

//Get All Quiz Questions
app.get('/quiz/questions', async (req, res) => {
  try {
    const questions = await Quiz.aggregate([
      { $sample: { size: 20 } },
      { $project: { QueDescription: 1, Options: 1, QuestionId: 1 } },
    ]);

    res.status(200).json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ message: `Failed to fetch questions: ${error.message}` });
  }
});

// Resume Quiz Session
app.get('/resume-quiz/:User_Id', async (req, res) => {
  const { User_Id } = req.params;

  try {
    const session = await UserSession.findOne({ User_Id, IsSubmitted: false });

    if (!session) {
      return res.status(404).json({ message: 'No active session found' });
    }

    const questions = await Quiz.find({ QuestionId: { $in: session.QuestionId } });

    res.status(200).json({ session, questions });
  } catch (error) {
    console.error('Error resuming quiz:', error);
    res.status(500).json({ message: `Failed to resume quiz: ${error.message}` });
  }
});

// Start a Quiz Session
const axios = require('axios'); // Import Axios for making HTTP requests

// Start a Quiz Session
// app.post('/start-quiz', async (req, res) => {
//   const { User_Id } = req.body;

//   try {
//     const sessionId = uuidv4();

//     // Fetch questions from the /quiz/questions API
//     const response = await axios.get(`http://localhost:${PORT}/quiz/questions`);
//     const questions = response.data;

//     // Create a new user session
//     const session = new UserSession({
//       SessionId: sessionId,
//       User_Id,
//       QuestionId: questions.map((q) => q.QuestionId),
//       IsSubmitted: false,
//       AttemptedQuestions: [],
//       CurrentScore: 0,
//     });

//     await session.save();
//     console.log('Quiz session started:', session);

//     res.status(201).json({ session, questions });
//   } catch (error) {
//     console.error('Error starting quiz:', error);
//     res.status(500).json({ message: `Failed to start quiz: ${error.message}` });
//   }
// });

app.post('/start-quiz', async (req, res) => {
  const { User_Id } = req.body;

  try {
    const sessionId = uuidv4();
    const questions = await Quiz.aggregate([
      { $sample: { size: 5 } },
      { $project: { QueDescription: 1, Options: 1, QuestionId: 1 } },
    ]);

    const session = new UserSession({
      SessionId: sessionId,
      User_Id,
      QuestionId: questions.map((q) => q.QuestionId),
      IsSubmitted: false,
      AttemptedQuestions: [],
      CurrentScore: 0,
    });

    await session.save();
    console.log('Quiz session started:', session);
    res.status(201).json({ session, questions });
  } catch (error) {
    console.error('Error starting quiz:', error);
    res.status(500).json({ message: `Failed to start quiz: ${error.message}` });
  }
});

// Attempt a Question

app.post('/attempt-question', async (req, res) => {
  const { SessionId, User_Id, QuestionId, SelectedOption } = req.body;

  try {
    // Validate required fields
    if (!SessionId || !User_Id || QuestionId === undefined || !SelectedOption) {
      console.log('Missing required fields:', { SessionId, User_Id, QuestionId, SelectedOption });
      return res.status(400).json({ message: 'Missing required fields' });
    }

    console.log(`Attempting question:`, { SessionId, User_Id, QuestionId, SelectedOption });

    // Find the user session
    const session = await UserSession.findOne({ SessionId, User_Id });
    if (!session) {
      console.log('Session not found:', { SessionId, User_Id });
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if quiz is already submitted
    if (session.IsSubmitted) {
      return res.status(400).json({ message: 'Quiz already submitted' });
    }

    // Check if question is already attempted
    if (session.AttemptedQuestions && session.AttemptedQuestions.includes(QuestionId)) {
      return res.status(400).json({ message: 'Question already attempted' });
    }

    // Find the question in the database
    const question = await Quiz.findOne({ QuestionId: parseInt(QuestionId) });
    if (!question) {
      console.log('Question not found:', QuestionId);
      return res.status(404).json({ message: 'Question not found' });
    }

    // Validate options and selected option
    console.log(`Question options:`, question.Options);
    if (!question.Options || typeof question.Options !== 'object') {
      return res.status(500).json({ message: 'Invalid question data: Options missing or malformed' });
    }

    // Convert options from Map to object if necessary
    const optionsObj = Object.fromEntries(question.Options);

    const selectedKey = Object.keys(optionsObj).find(key => optionsObj[key] === SelectedOption);
    if (!selectedKey) {
      console.log(`Invalid option selected:`, SelectedOption);
      return res.status(400).json({ message: 'Invalid option selected' });
    }

    const isCorrect = String(question.Answer).trim() === String(optionsObj[selectedKey]).trim();

    // Update session data
    session.AttemptedQuestions = session.AttemptedQuestions || [];
    session.AttemptedQuestions.push(QuestionId);
    if (isCorrect) {
      session.CurrentScore += 1;
    }

    await session.save();
    console.log(`Question attempted: ${QuestionId}, Correct: ${isCorrect}, Current Score: ${session.CurrentScore}`);

    res.status(200).json({
      message: 'Question attempted successfully',
      isCorrect,
      currentScore: session.CurrentScore,
    });
  } catch (error) {
    console.error('Error attempting question:', error);
    res.status(500).json({ message: `Failed to attempt question: ${error.message}` });
  }
});





// Submit the Quiz
app.post('/submit-quiz', async (req, res) => {
  const { SessionId, User_Id, Answers } = req.body;

  try {
    const session = await UserSession.findOne({ SessionId, User_Id });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.IsSubmitted) {
      return res.status(400).json({ message: 'Quiz already submitted' });
    }

    session.IsSubmitted = true;
    session.Status = 'Completed';

    await session.save();
    console.log('Quiz session submitted:', session);

    const result = new Result({
      User_Id,
      Score: session.CurrentScore,
      ContestId: SessionId,
      QuestionId: session.AttemptedQuestions,
      Answers: Answers || {},
      IsAttempted: true,
      Attempted_at: new Date(),
    });

    await result.save();

    res.status(200).json({
      message: 'Quiz submitted successfully',
      score: session.CurrentScore,
      result,
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ message: `Failed to submit quiz: ${error.message}` });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});







// const express = require('express');
// const mongoose = require('mongoose');
// const bodyParser = require('body-parser');
// const { v4: uuidv4 } = require('uuid');
// const cors = require('cors');

// // Models
// const Quiz = require('./models/quiz');
// const Result = require('./models/result');
// const UserSession = require('./models/session');

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(bodyParser.json());

// // Connect to MongoDB
// mongoose.connect('mongodb://localhost:27017/Quiz_Module', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err));

// // Start a Quiz Session
// app.post('/start-quiz', async (req, res) => {
//   const User_ID = req.body.User_Id;

//   try {
//     const sessionId = uuidv4();
//     const questions = await Quiz.aggregate([
//       { $sample: { size: 5 } },
//       { $project: { QueDescription: 1, Options: 1, QuestionId: 1 } },
//     ]);

//     const session = new UserSession({
//       SessionId: sessionId,
//       User_Id: User_ID,
//       QuestionId: questions.map((q) => q.QuestionId),
//     });

//     await session.save();
//     res.status(201).json({ session, questions });
//   } catch (error) {
//     res.status(500).json({ message: `Failed to start quiz: ${error.message}` });
//   }
// });

// // Submit the Quiz
// app.post('/submit-quiz', async (req, res) => {
//   const { SessionId, User_Id } = req.body;

//   try {
//     const session = await UserSession.findOne({ SessionId, User_Id });

//     if (!session) {
//       return res.status(404).json({ message: 'Session not found' });
//     }

//     if (session.IsSubmitted) {
//       return res.status(400).json({ message: 'Quiz already submitted' });
//     }

//     // Finalize the quiz session
//     session.IsSubmitted = true;
//     session.Status = 'Completed';
//     session.TotalScore = session.QuestionId.length;

//     await session.save();

//     // Save results
//     const result = new Result({
//       User_Id,
//       Score: session.CurrentScore || 0,
//       ContestId: SessionId,
//       QuestionId: session.AttemptedQuestions || [],
//       Answers: req.body.Answers || {},
//       IsAttempted: true,
//       Attempted_at: new Date(),
//     });

//     await result.save();

//     res.status(200).json({
//       message: 'Quiz submitted successfully',
//       score: session.CurrentScore || 0,
//       result,
//     });
//   } catch (error) {
//     res.status(500).json({ message: `Failed to submit quiz: ${error.message}` });
//   }
// });

// // app.post('/submit-quiz', async (req, res) => {
// //   const { SessionId, User_Id, Answers } = req.body;

// //   try {
// //     const session = await UserSession.findOne({ User_Id, SessionId });
// //     if (!session) {
// //       return res.status(404).json({ message: 'Session not found' });
// //     }

// //     if (session.IsSubmitted) {
// //       return res.status(400).json({ message: 'Quiz already submitted' });
// //     }

// //     let score = 0;
// //     const questionIds = Object.keys(Answers);

// //     for (const questionId of questionIds) {
// //       const question = await Quiz.findOne({ QuestionId: parseInt(questionId) });
// //       if (question && question.Answer === Answers[questionId]) {
// //         score++;
// //       }
// //     }

// //     session.IsSubmitted = true;
// //     session.CurrentScore = score;
// //     session.TotalScore = questionIds.length;
// //     session.Status = 'Completed';
// //     session.QuestionId = questionIds.map(Number);
// //     await session.save();

// //     const result = new Result({
// //       User_Id,
// //       Score: score,
// //       ContestId: SessionId,
// //       QuestionId: questionIds.map(Number),
// //       Answers,
// //       IsAttempted: true,
// //       Attempted_at: new Date(),
// //     });

// //     await result.save();

// //     res.status(200).json({ message: 'Quiz submitted successfully', result });
// //   } catch (error) {
// //     res.status(500).json({ message: `Failed to submit quiz: ${error.message}` });
// //   }
// // });

// // Get Quiz Questions
// app.get('/quiz/questions', async (req, res) => {
//   try {
//     const questions = await Quiz.aggregate([
//       { $sample: { size: 5 } },
//       { $project: { QueDescription: 1, Options: 1, QuestionId: 1 } },
//     ]);
//     res.json(questions);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch quiz questions' });
//   }
// });

// // Attempt a Question
// app.post('/attempt-question', async (req, res) => {
//   const { SessionId, User_Id, QuestionId, SelectedOption } = req.body;

//   try {
//     const session = await UserSession.findOne({ SessionId, User_Id });

//     if (!session) {
//       return res.status(404).json({ message: 'Session not found' });
//     }

//     if (session.IsSubmitted) {
//       return res.status(400).json({ message: 'Quiz already submitted' });
//     }

//     // Check if the question is already attempted
//     if (session.AttemptedQuestions?.includes(QuestionId)) {
//       return res.status(400).json({ message: 'Question already attempted' });
//     }

//     // Find the question in the database
//     const question = await Quiz.findOne({ QuestionId: parseInt(QuestionId) });

//     if (!question) {
//       return res.status(404).json({ message: 'Question not found' });
//     }

//     // Update session state
//     const isCorrect = question.Answer === SelectedOption;
//     session.AttemptedQuestions = session.AttemptedQuestions || [];
//     session.AttemptedQuestions.push(QuestionId);

//     session.CurrentScore = session.CurrentScore || 0;
//     if (isCorrect) {
//       session.CurrentScore += 1;
//     }

//     await session.save();

//     res.status(200).json({
//       message: 'Question attempted successfully',
//       isCorrect,
//       currentScore: session.CurrentScore,
//     });
//   } catch (error) {
//     res.status(500).json({ message: `Failed to attempt question: ${error.message}` });
//   }
// });



// // Start the server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });
