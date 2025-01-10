// controllers/sessionController.js
const Session = require('../models/session'); // Adjust path as necessary

// Function to generate a unique session ID
function generateUniqueSessionId() {
  return `session_${Date.now()}_${Math.floor(Math.random() * 10000)}`; // Adjust the logic as needed
}

// Start a new test session
async function startTest(userId, questionIds) {
  const sessionId = generateUniqueSessionId();
  const sessionData = {
    QuestionId: questionIds,
    SessionId: sessionId,
    User_Id: userId,
    CurrentQues: 0,
    IsSubmitted: false,
    IsDisconnected: false,
    CurrentScore: 0,
    TotalScore: 20,
  };

  const session = new Session(sessionData);
  await session.save();
  return session;
}

// Retrieve a session by session ID
async function getSession(sessionId) {
  const session = await Session.findOne({ SessionId: sessionId });
  return session;
}

// Update session data
async function updateSession(sessionId, updateData) {
  const session = await Session.findOneAndUpdate({ SessionId: sessionId }, updateData, { new: true });
  return session;
}

module.exports = {
  startTest,
  getSession,
  updateSession,
};
