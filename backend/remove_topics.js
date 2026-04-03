require("dotenv").config();
const mongoose = require("mongoose");
const Topic = require("./models/Topic");
const Question = require("./models/Question");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/quizengine";

const topicsToRemove = [
  "CSS Styling",
  "JavaScript Basics",
  "React Framework",
  "Node.js Backend",
  "Full Stack Dev"
];

async function removeTopics() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("📦 Connected to MongoDB...");

    for (const name of topicsToRemove) {
      const topic = await Topic.findOne({ name });
      if (topic) {
        // Remove all questions for this topic
        const qResult = await Question.deleteMany({ topicId: topic._id });
        console.log(`🗑️ Deleted ${qResult.deletedCount} questions for topic: ${name}`);

        // Remove the topic itself
        await Topic.deleteOne({ _id: topic._id });
        console.log(`🗑️ Deleted topic: ${name}`);
      } else {
        console.log(`❓ Topic not found: ${name}`);
      }
    }

    // Clean up prerequisites for remaining topics just in case
    await Topic.updateMany({}, { $set: { prerequisites: [] } });
    console.log("✅ Cleared all remaining prerequisites.");

    console.log("✨ Done!");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

removeTopics();
