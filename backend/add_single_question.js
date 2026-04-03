require("dotenv").config();
const mongoose = require("mongoose");
const Topic = require("./models/Topic");
const Question = require("./models/Question");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/quizengine";

const newQuestion = {
  text: "Which HTML attribute specifies that an input field must be filled out before submitting a form?",
  options: ["placeholder", "required", "validate", "mandatory"],
  correctAnswer: 1,
  difficulty: "medium",
  explanation: "The required attribute is a boolean attribute added directly to an input element. It prevents form submission if the field is left empty, and works on input, textarea, and select elements without any JavaScript needed.",
  timeLimitSeconds: 25
};

async function addQuestion() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("📦 Connected to MongoDB...");

    const htmlTopic = await Topic.findOne({ name: "HTML Fundamentals" });
    if (!htmlTopic) {
      console.error("❌ Could not find 'HTML Fundamentals' topic.");
      process.exit(1);
    }

    await Question.create({
      ...newQuestion,
      topicId: htmlTopic._id
    });
    
    console.log(`✅ Successfully added the new question! Total for HTML should now be 20.`);

  } catch (err) {
    console.error("❌ Error adding question:", err);
  } finally {
    await mongoose.disconnect();
  }
}

addQuestion();
