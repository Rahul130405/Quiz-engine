require("dotenv").config();
const mongoose = require("mongoose");
const Topic = require("./models/Topic");
const Question = require("./models/Question");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/quizengine";

const javaQuestions = [
  { text: "Which package is automatically imported in every Java program?", options: ["java.util", "java.io", "java.lang", "java.awt"], correctAnswer: 2, difficulty: "easy", explanation: "java.lang is imported by default." },
  { text: "Which class is used for reading data from a file in Java?", options: ["FileReader", "Scanner", "InputStream", "Console"], correctAnswer: 0, difficulty: "easy" },
  { text: "Which package contains classes for input and output operations?", options: ["java.util", "java.io", "java.lang", "java.sql"], correctAnswer: 1, difficulty: "easy" },
  { text: "Which keyword is used to define a package in Java?", options: ["import", "package", "class", "extends"], correctAnswer: 1, difficulty: "easy" },
  { text: "Which method is used to write data into a file?", options: ["read()", "write()", "print()", "input()"], correctAnswer: 1, difficulty: "easy" },
  { text: "Which exception is thrown when a file is not found?", options: ["IOException", "FileNotFoundException", "NullPointerException", "ArithmeticException"], correctAnswer: 1, difficulty: "easy" },
  { text: "Which block is always executed in exception handling?", options: ["try", "catch", "finally", "throw"], correctAnswer: 2, difficulty: "easy" },
  { text: "Which keyword is used to explicitly throw an exception?", options: ["throws", "throw", "catch", "final"], correctAnswer: 1, difficulty: "easy" },
  { text: "Which keyword is used to declare exceptions?", options: ["throw", "throws", "try", "catch"], correctAnswer: 1, difficulty: "medium" },
  { text: "Which exception occurs when dividing by zero?", options: ["IOException", "ArithmeticException", "NullPointerException", "ArrayIndexOutOfBoundsException"], correctAnswer: 1, difficulty: "easy" },
  { text: "Which class is used to create user-defined exceptions?", options: ["Exception", "Error", "Throwable", "Runtime"], correctAnswer: 0, difficulty: "medium", explanation: "Custom exceptions extend Exception class." },
  { text: "Which method starts a thread?", options: ["run()", "start()", "execute()", "init()"], correctAnswer: 1, difficulty: "easy" },
  { text: "Which interface is implemented to create a thread?", options: ["Runnable", "Serializable", "Cloneable", "Comparable"], correctAnswer: 0, difficulty: "easy" },
  { text: "Which method is used to pause a thread?", options: ["sleep()", "wait()", "stop()", "suspend()"], correctAnswer: 0, difficulty: "medium" },
  { text: "Which method is used for inter-thread communication?", options: ["sleep()", "notify()", "run()", "start()"], correctAnswer: 1, difficulty: "medium" },
  { text: "Which method is used to wait for a thread to finish?", options: ["sleep()", "join()", "wait()", "yield()"], correctAnswer: 1, difficulty: "medium" },
  { text: "Which method is used to stop a thread (deprecated)?", options: ["stop()", "end()", "destroy()", "finish()"], correctAnswer: 0, difficulty: "medium" },
  { text: "Which package is used for database connectivity?", options: ["java.io", "java.sql", "java.util", "java.lang"], correctAnswer: 1, difficulty: "easy" },
  { text: "Which class is used for buffered input?", options: ["BufferedReader", "FileReader", "Scanner", "InputStream"], correctAnswer: 0, difficulty: "easy" },
  { text: "Which concept ensures only one thread accesses a resource at a time?", options: ["Inheritance", "Polymorphism", "Synchronization", "Encapsulation"], correctAnswer: 2, difficulty: "medium" }
];

async function addJava() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("📦 Connected to MongoDB...");

    // 1. Create Java Topic
    const javaTopic = await Topic.create({
      name: "Java Programming",
      description: "Learn core Java concepts including Packages, Exception Handling, and Multithreading.",
      icon: "☕",
      color: "#f89820",
      position: { x: 500, y: 250 },
      passingScore: 65,
      order: 2
    });
    console.log("✅ Java topic created");

    // 2. Add Questions
    const questionsWithId = javaQuestions.map(q => ({
      ...q,
      topicId: javaTopic._id,
      timeLimitSeconds: 25
    }));

    await Question.insertMany(questionsWithId);
    console.log(`✅ Added ${javaQuestions.length} Java questions`);

    console.log("✨ Java section added successfully!");
  } catch (err) {
    console.error("❌ Error adding Java section:", err);
  } finally {
    await mongoose.disconnect();
  }
}

addJava();
