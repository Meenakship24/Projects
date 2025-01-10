const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
  User_Id: { type: String, required: true },
  Score: { type: Number, required: true },
  ContestId: { type: String, required: true },
  QuestionId: { type: [Number], required: true },
  Answers: { type: Object, required: true },
  IsAttempted: { type: Boolean, default: true },
  Attempted_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Result', ResultSchema);
