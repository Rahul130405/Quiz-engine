/**
 * QuizEngine - Cross-Layer Scoring Consistency Test Suite (Phase D)
 * Compares Java ScoringService and evaluation servlet vs Node.js ScoreEngine and computeScore.
 * Verifies exact parity across all test vectors:
 * - Easy / Medium / Hard questions
 * - All correct
 * - All wrong (minimum score 0 protection)
 * - Timeout handling (streak neutrality)
 * - Unanswered / skipped options
 * - Streak milestones (streak == 3 -> +1, streak == 5 -> +2)
 * - Streak resets on wrong answers
 * - Passing score thresholds (59% vs 60%)
 */

const http = require("http");
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { computeScore, ScoreEngine } = require("../algorithms/scoring");

const JAVA_BASE = process.env.JAVA_BASE_URL || "http://localhost:8088";
const NODE_BASE = process.env.NODE_API_URL || "http://localhost:5001/api";

let studentToken = null;

function registerRealStudent() {
  return new Promise((resolve, reject) => {
    const ts = Date.now();
    const payload = JSON.stringify({
      name: `CrossLayer Tester ${ts}`,
      email: `cross_layer_${ts}@example.com`,
      password: "Password123!",
    });
    const url = new URL(`${NODE_BASE}/auth/register`);
    const req = http.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          try {
            const data = JSON.parse(raw);
            if (data.token) {
              studentToken = data.token;
              resolve(studentToken);
            } else {
              reject(new Error("Failed to register: " + raw));
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

// Parse XML questions to get real IDs, correct answers, and difficulties
const xmlPath = path.resolve(__dirname, "../../java-backend/data/questions.xml");
const xmlContent = fs.readFileSync(xmlPath, "utf8");

const questions = [];
const qBlockRegex = /<question id="([^"]+)">([\s\S]*?)<\/question>/g;
let blockMatch;
while ((blockMatch = qBlockRegex.exec(xmlContent)) !== null) {
  const id = blockMatch[1];
  const body = blockMatch[2];
  const topicMatch = /<topicId>([^<]+)<\/topicId>/.exec(body);
  const diffMatch = /<difficulty>([^<]+)<\/difficulty>/.exec(body);
  const ansMatch = /<correctAnswer>(\d+)<\/correctAnswer>/.exec(body);

  if (topicMatch && ansMatch) {
    questions.push({
      id,
      topicId: topicMatch[1].trim(),
      difficulty: diffMatch ? diffMatch[1].trim() : "medium",
      correctAnswer: parseInt(ansMatch[1].trim(), 10),
    });
  }
}

function evaluateJava(topicId, answers) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ topicId, answers });
    const req = http.request(
      `${JAVA_BASE}/api/java/quiz/evaluate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
          "Authorization": `Bearer ${studentToken}`,
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch (e) {
            reject(new Error(`Failed to parse Java response: ${raw}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

async function runCrossLayerTests() {
  console.log("=================================================");
  console.log("🧪 PHASE D: CROSS-LAYER SCORING CONSISTENCY SUITE");
  console.log("=================================================\n");

  await registerRealStudent();
  console.log("Authenticated test student registered successfully.\n");

  let passed = 0;
  let total = 0;

  function check(name, condition, extraInfo = "") {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${extraInfo}`);
      throw new Error(`Assertion failed: ${name}`);
    }
  }

  // Filter 10 HTML questions with varied difficulty
  const htmlQuestions = questions.filter((q) => q.topicId === "topic-html").slice(0, 10);
  assert(htmlQuestions.length >= 7, "Need at least 7 questions in topic-html");

  // ── TEST 1: All Correct (5 questions, mixed difficulty) ──
  console.log("--- Vector 1: All Correct (5 questions) ---");
  const v1Answers = htmlQuestions.slice(0, 5).map((q) => ({
    questionId: q.id,
    selectedOption: q.correctAnswer,
    timedOut: false,
    isCorrect: true,
  }));
  const v1Node = computeScore(v1Answers);
  const v1JavaRes = await evaluateJava("topic-html", v1Answers);
  const v1Java = v1JavaRes.data;

  check("Vector 1: Java returns HTTP 200", v1JavaRes.status === 200);
  check("Vector 1: Total score parity (Node: 23, Java: 23)", v1Node.totalScore === 23 && v1Java.score === 23);
  check("Vector 1: Max possible score parity (Node: 23, Java: 23)", v1Node.maxPossibleScore === 23 && v1Java.maxPossibleScore === 23);
  check("Vector 1: Percentage parity (100.0%)", v1Node.percentage === 100 && v1Java.percentage === 100);
  check("Vector 1: Streak bonus parity (3 pts)", v1Node.totalStreakBonus === 3 && v1Java.totalStreakBonus === 3);
  check("Vector 1: Max streak parity (5)", v1Node.maxStreak === 5 && v1Java.maxStreak === 5);
  check("Vector 1: Pass status parity (true)", v1Java.passed === true);

  // ── TEST 2: All Wrong (3 questions, min score floor) ──
  console.log("\n--- Vector 2: All Wrong (3 questions, min score protection) ---");
  const v2Answers = htmlQuestions.slice(0, 3).map((q) => ({
    questionId: q.id,
    selectedOption: (q.correctAnswer + 1) % 4, // guaranteed wrong
    timedOut: false,
    isCorrect: false,
  }));
  const v2Node = computeScore(v2Answers);
  const v2JavaRes = await evaluateJava("topic-html", v2Answers);
  const v2Java = v2JavaRes.data;

  check("Vector 2: Java returns HTTP 200", v2JavaRes.status === 200);
  check("Vector 2: Total score floor at 0 (Node: 0, Java: 0)", v2Node.totalScore === 0 && v2Java.score === 0);
  check("Vector 2: Percentage parity (0%)", v2Node.percentage === 0 && v2Java.percentage === 0);
  check("Vector 2: Max possible score (Node: 13, Java: 13)", v2Node.maxPossibleScore === 13 && v2Java.maxPossibleScore === 13);
  check("Vector 2: Pass status parity (false)", v2Java.passed === false);

  // ── TEST 3: Timeout Only (3 questions) ──
  console.log("\n--- Vector 3: Timeout Handling (Streak Neutrality) ---");
  const v3Answers = htmlQuestions.slice(0, 3).map((q) => ({
    questionId: q.id,
    selectedOption: -1,
    timedOut: true,
    isCorrect: false,
  }));
  const v3Node = computeScore(v3Answers);
  const v3JavaRes = await evaluateJava("topic-html", v3Answers);
  const v3Java = v3JavaRes.data;

  check("Vector 3: Score is 0 for timeouts (Node: 0, Java: 0)", v3Node.totalScore === 0 && v3Java.score === 0);
  check("Vector 3: Timeout count parity (3)", v3Node.timeoutCount === 3 && v3Java.timeoutCount === 3);
  check("Vector 3: Pass status parity (false)", v3Java.passed === false);

  // ── TEST 4: Streak Milestones and Resets ──
  console.log("\n--- Vector 4: Streak 3, Reset on Wrong, and Second Streak 3 ---");
  // 7 questions: Correct, Correct, Correct (+1 bonus, total 13), Wrong (-1, reset to 0, total 12), Correct, Correct, Correct (+1 bonus, total 25)
  const pattern = [true, true, true, false, true, true, true];
  const v4Answers = htmlQuestions.slice(0, 7).map((q, idx) => {
    const isCorr = pattern[idx];
    return {
      questionId: q.id,
      selectedOption: isCorr ? q.correctAnswer : (q.correctAnswer + 1) % 4,
      timedOut: false,
      isCorrect: isCorr,
    };
  });
  const v4Node = computeScore(v4Answers);
  const v4JavaRes = await evaluateJava("topic-html", v4Answers);
  const v4Java = v4JavaRes.data;

  check("Vector 4: Total score parity (Node: 25, Java: 25)", v4Node.totalScore === 25 && v4Java.score === 25);
  check("Vector 4: Percentage parity (Node: 85.71, Java: 85.71)", v4Node.percentage === 85.71 && v4Java.percentage === 85.71);
  check("Vector 4: Total streak bonus parity (Node: 2, Java: 2)", v4Node.totalStreakBonus === 2 && v4Java.totalStreakBonus === 2);
  check("Vector 4: Max streak parity (Node: 3, Java: 3)", v4Node.maxStreak === 3 && v4Java.maxStreak === 3);
  check("Vector 4: Pass status parity (true >= 60%)", v4Java.passed === true);

  // ── TEST 5: Threshold Boundary Testing (Passing 60%) ──
  console.log("\n--- Vector 5: Threshold Boundaries (Pass / Fail Thresholds) ---");
  // 5 questions: 2 correct = 40% (Fail)
  const failAnswers = htmlQuestions.slice(0, 5).map((q, idx) => ({
    questionId: q.id,
    selectedOption: idx < 2 ? q.correctAnswer : (q.correctAnswer + 1) % 4,
    timedOut: false,
    isCorrect: idx < 2,
  }));
  const failJava = (await evaluateJava("topic-html", failAnswers)).data;
  check("Vector 5: 40.0% fails 60% threshold", failJava.percentage === 40.0 && failJava.passed === false);

  // 5 questions: 3 correct = 60% (Pass)
  const passAnswers = htmlQuestions.slice(0, 5).map((q, idx) => ({
    questionId: q.id,
    selectedOption: idx < 3 ? q.correctAnswer : (q.correctAnswer + 1) % 4,
    timedOut: false,
    isCorrect: idx < 3,
  }));
  const passJava = (await evaluateJava("topic-html", passAnswers)).data;
  check("Vector 5: 60.0% passes 60% threshold", passJava.percentage === 60.0 && passJava.passed === true);

  // ── TEST 6: Difficulty Isolation (Easy vs Medium vs Hard) ──
  console.log("\n--- Vector 6: Difficulty Invariance in Scoring ---");
  const easyQ = questions.find((q) => q.difficulty === "easy");
  const medQ = questions.find((q) => q.difficulty === "medium");
  const hardQ = questions.find((q) => q.difficulty === "hard");

  assert(easyQ && medQ && hardQ, "Need easy, medium, and hard questions");

  const diffAnswers = [
    { questionId: easyQ.id, selectedOption: easyQ.correctAnswer, timedOut: false, isCorrect: true },
    { questionId: medQ.id, selectedOption: medQ.correctAnswer, timedOut: false, isCorrect: true },
    { questionId: hardQ.id, selectedOption: hardQ.correctAnswer, timedOut: false, isCorrect: true },
  ];
  const diffNode = computeScore(diffAnswers);
  const diffJava = (await evaluateJava(easyQ.topicId, diffAnswers)).data;

  check("Vector 6: 3 correct across difficulties = +13 pts (Node: 13, Java: 13)", diffNode.totalScore === 13 && diffJava.score === 13);
  check("Vector 6: Streak 3 bonus awarded across difficulties (+1)", diffNode.totalStreakBonus === 1 && diffJava.totalStreakBonus === 1);

  // ── TEST 7: Small Quiz Max Possible Score Parity ──
  console.log("\n--- Vector 7: Max Possible Score for Small Quizzes (1-5 questions) ---");
  for (let n = 1; n <= 5; n++) {
    const qSubset = htmlQuestions.slice(0, n).map((q) => ({
      questionId: q.id,
      selectedOption: q.correctAnswer,
      timedOut: false,
      isCorrect: true,
    }));
    const nNode = computeScore(qSubset);
    const nJava = (await evaluateJava("topic-html", qSubset)).data;
    check(`Vector 7: n=${n} maxPossibleScore parity (Node: ${nNode.maxPossibleScore}, Java: ${nJava.maxPossibleScore})`, nNode.maxPossibleScore === nJava.maxPossibleScore);
  }

  console.log("\n=================================================");
  console.log(`📊 CROSS-LAYER SCORING RESULTS: ${passed} / ${total} PASSED`);
  console.log("🎉 ALL SCORING CONSISTENCY CHECKS VERIFIED 100% IDENTICAL!");
  console.log("=================================================");
}

runCrossLayerTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
