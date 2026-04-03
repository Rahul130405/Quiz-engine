const mongoose = require("mongoose");

/**
 * Topic Schema
 * Topics are NODES in the learning graph.
 * prerequisites = directed edges pointing to dependency nodes.
 */
const topicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      default: "",
    },
    icon: {
      type: String,
      default: "📚",
    },
    color: {
      type: String,
      default: "#6366f1",
    },
    // Array of Topic ObjectIds that must be completed before this topic unlocks
    prerequisites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Topic",
      },
    ],
    // Position on graph canvas for visual rendering
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },
    passingScore: {
      type: Number,
      default: 60, // Percentage needed to mark topic as complete
    },
    order: {
      type: Number,
      default: 0, // For topological ordering
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Topic", topicSchema);
