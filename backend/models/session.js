const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    SessionId: { type: String, required: true, unique: true },
    User_Id: { type: String, required: true },
    AttemptedQuestions: { type: [String], default: [] },  // Array to track attempted question IDs
    CurrentQues: { type: String, default: "" }, // Track the current question dynamically
    IsSubmitted: { type: Boolean, default: false },
    IsDisconnected: { type: Boolean, default: false },
    CurrentScore: { type: Number, default: 0 },
    TotalScore: { type: Number, default: 0 },
    Status: { type: String, enum: ['In Progress', 'Completed', 'Disconnected'], default: 'In Progress' },
    QuestionId: { type: [String], default: [] }, // Store question IDs in an array
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'UserSession' }
);

sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const UserSession = mongoose.model('UserSession', sessionSchema);

module.exports = UserSession;

// const mongoose = require('mongoose');

// const sessionSchema = new mongoose.Schema({
//   SessionId: { type: String, required: true, unique: true },
//   User_Id: { type: String, required: true },
//   Attempted: { type: String, default: "" },
//   CurrentQues: { type: String, default: "" },
//   IsSubmitted: { type: Boolean, default: false },
//   IsDisconnected: { type: Boolean, default: false },
//   CurrentScore: { type: Number, default: 0 },
//   TotalScore: { type: Number, default: 0 },
//   Status: { type: String, default: "" },
//   QuestionId: { type: [String], default: [] },  // Explicitly define as an array of strings
//   createdAt: { type: Date, default: Date.now }
// }, {
//   collection: 'UserSession' // Explicitly specify the collection name
// });

// const UserSession = mongoose.model('UserSession', sessionSchema);

// module.exports = UserSession; // Ensure the export is correct
