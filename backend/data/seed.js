/**
 * QuizEngine — Database Seed Script (Cleaned Version)
 * Run with: npm run seed
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Topic = require("../models/Topic");
const Question = require("../models/Question");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/quizengine";

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("📦 Connected to MongoDB for seeding...");

  // Clear existing data (Topics and Questions only, keeping registered users if any)
  // Actually, standard seed usually clears everything. 
  // User asked to remove AI/Demo users, so we'll make sure they aren't here.
  await Promise.all([Topic.deleteMany(), Question.deleteMany()]);
  console.log("🗑️  Cleared existing topics and questions");

  // ── Create Topics ─────────────────────────────────────────────────────────
  const [html, daa, java] = await Topic.insertMany([
    {
      name: "HTML Fundamentals",
      description: "Learn the building blocks of the web",
      icon: "🌐",
      color: "#e34c26",
      prerequisites: [],
      position: { x: 100, y: 250 },
      passingScore: 60,
      order: 0,
    },
    {
      name: "Design Analysis and Algorithm (DAA)",
      description: "Master algorithm design, complexity analysis, and efficiency.",
      icon: "🧠",
      color: "#475569",
      prerequisites: [],
      position: { x: 300, y: 250 },
      passingScore: 70,
      order: 1,
    },
    {
      name: "Java Programming",
      description: "Learn core Java concepts including Packages, Exception Handling, and Multithreading.",
      icon: "☕",
      color: "#f89820",
      position: { x: 500, y: 250 },
      passingScore: 65,
      order: 2
    }
  ]);

  console.log("✅ Topics created");

  // ── Create Sample Questions ──────────────────────────────────────────────
  const questions = [
    { topicId: html._id, difficulty: "easy", timeLimitSeconds: 20,
      text: "What does HTML stand for?",
      options: ["HyperText Markup Language", "High Tech Modern Language", "HyperTransfer Markup Logic", "Hybrid Text Markup Language"],
      correctAnswer: 0, explanation: "HTML = HyperText Markup Language." },
    { topicId: daa._id, difficulty: "easy", timeLimitSeconds: 20,
      text: "What is the time complexity of Binary Search in the worst case?",
      options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
      correctAnswer: 1, explanation: "Binary search halves the search space each time → O(log n)." },
    { topicId: java._id, difficulty: "easy", timeLimitSeconds: 25,
      text: "Which package is automatically imported in every Java program?",
      options: ["java.util", "java.io", "java.lang", "java.awt"],
      correctAnswer: 2, explanation: "java.lang is imported by default." }
  ];

  await Question.insertMany(questions);
  console.log(`✅ Sample questions created (Add more via dedicated scripts)`);

  console.log("\n🎉 Seed complete! No AI or Demo users were created.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
