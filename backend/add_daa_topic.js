require("dotenv").config();
const mongoose = require("mongoose");
const Topic = require("./models/Topic");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/quizengine";

async function addDAATopic() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("📦 Connected to MongoDB...");

    // Check if DAA already exists
    const existing = await Topic.findOne({ name: "Design Analysis and Algorithm (DAA)" });
    if (existing) {
      console.log("Topic already exists.");
      process.exit(0);
    }

    // Find JS Basics to use as prerequisite
    const jsBasics = await Topic.findOne({ name: "JavaScript Basics" });

    const daaTopic = {
      name: "Design Analysis and Algorithm (DAA)",
      description: "Master algorithm design, complexity analysis, and efficiency.",
      icon: "🧠",
      color: "#475569", // Slate blue-gray
      prerequisites: jsBasics ? [jsBasics._id] : [],
      position: { x: 500, y: 100 }, // Positioned above JS Basics
      passingScore: 70,
      order: 3 // Higher order than JS (2)
    };

    const newTopic = await Topic.create(daaTopic);
    console.log(`✅ Successfully added ${newTopic.name}!`);

    // Optionally update other topics if needed to balance the graph
    // For example, making React/Node depend on DAA too, but let's keep it simple for now.

  } catch (err) {
    console.error("❌ Error adding topic:", err);
  } finally {
    await mongoose.disconnect();
  }
}

addDAATopic();
