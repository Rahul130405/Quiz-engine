require("dotenv").config();
const mongoose = require("mongoose");
const Topic = require("./models/Topic");
const User = require("./models/User");
const { topologicalSort, getTopicsWithStatus } = require("./algorithms/graph");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/quizengine";

async function testApi() {
  try {
    await mongoose.connect(MONGO_URI);
    const topics = await Topic.find().populate("prerequisites", "name").lean();
    console.log("Topics found in DB:", topics.length);

    const sorted = topologicalSort(topics.map((t) => ({ ...t, _id: t._id })));
    console.log("Sorted order:", sorted.length);

    const topicMap = new Map(topics.map((t) => [t._id.toString(), t]));
    const orderedTopics = sorted.map((id) => topicMap.get(id)).filter(Boolean);

    // Assume we check for the admin user or demo user
    const user = await User.findOne({ email: "demo@quizengine.dev" });
    if (!user) {
      console.log("User not found, returning raw ordered topics");
      console.log(orderedTopics.map(t => t.name));
      return;
    }

    const result = getTopicsWithStatus(
      orderedTopics.map((t) => ({
        toObject: () => t,
        ...t,
        prerequisites: t.prerequisites || [],
      })),
      user.progress
    );

    console.log("Final API Result Names:");
    result.forEach(t => console.log(`- ${t.name} (Unlocked: ${t.unlocked})`));

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

testApi();
