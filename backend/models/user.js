const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  User_ID: { type: String, required: true },
  User_name: { type: String, required: true }
});

module.exports = mongoose.model('users', userSchema);  // Use 'users' collection


// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   username: { type: String, required: true },
//   attemptedQuestions: [{
//     questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
//     selectedOption: String,
//     isCorrect: Boolean
//   }],
//   totalScore: { type: Number, default: 0 }
// });

// module.exports = mongoose.model('User', userSchema);
