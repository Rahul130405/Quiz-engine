const mongoose = require("mongoose");

/**
 * Question Schema
 * Each question belongs to a topic and has a difficulty level
 */
const questionSchema = new mongoose.Schema(
  {
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },
    text: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => arr.length === 4,
        message: "Exactly 4 options are required",
      },
    },
    correctAnswer: {
      type: Number, // Index 0-3 of correct option
      required: true,
      min: 0,
      max: 3,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    explanation: {
      type: String,
      default: "",
    },
    tags: [String],
    timeLimitSeconds: {
      type: Number,
      default: 30,
    },
  },
  { timestamps: true }
);

// Index for fast topic+difficulty lookups
questionSchema.index({ topicId: 1, difficulty: 1 });

module.exports = mongoose.model("Question", questionSchema);
