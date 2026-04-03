const mongoose = require("mongoose");

/**
 * QuizAttempt Schema
 * Records every quiz session: questions asked, answers given, score breakdown
 */
const attemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    maxPossibleScore: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    timeTakenSeconds: {
      type: Number,
      default: 0,
    },
    // Detailed per-question breakdown
    answers: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
        selectedOption: Number,   // -1 = timed out / skipped
        isCorrect: Boolean,
        timeTakenSeconds: Number,
        scoreChange: Number,      // e.g. +5, -1, +7 (with streak bonus)
      },
    ],
    streakBonus: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index for leaderboard queries
attemptSchema.index({ topicId: 1, score: -1 });
attemptSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("QuizAttempt", attemptSchema);
