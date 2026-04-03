require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const QuizAttempt = require("./models/QuizAttempt");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/quizengine";

async function cleanup() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("📦 Connected to MongoDB...");

    const userNames = ["Carol White", "Alice Chen", "Bob Smith", "Admin", "Demo User"];
    
    // Find these users
    const users = await User.find({ name: { $in: userNames } });
    const userIds = users.map(u => u._id);

    if (userIds.length > 0) {
      // 1. Delete their quiz attempts so they disappear from leaderboard
      const deletedAttempts = await QuizAttempt.deleteMany({ userId: { $in: userIds } });
      console.log(`🗑️  Deleted ${deletedAttempts.deletedCount} quiz attempts.`);

      // 2. Delete the users
      const deletedUsers = await User.deleteMany({ _id: { $in: userIds } });
      console.log(`🗑️  Deleted ${deletedUsers.deletedCount} users: ${users.map(u => u.name).join(", ")}`);
    } else {
      console.log("❓ No matching users found to delete.");
    }

    console.log("✨ Cleanup complete!");
  } catch (err) {
    console.error("❌ Error during cleanup:", err);
  } finally {
    await mongoose.disconnect();
  }
}

cleanup();
