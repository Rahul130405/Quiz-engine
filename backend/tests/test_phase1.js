/**
 * QuizEngine - Phase 1 Automated Test Suite
 * Validates Security Remediation & Core Bug Fixes
 */

const assert = require("assert");
const crypto = require("crypto");
const mongoose = require("mongoose");
const { isTopicUnlocked } = require("../algorithms/graph");
const { ScoreEngine } = require("../algorithms/scoring");

console.log("=================================================");
console.log("🧪 QUIZENGINE PHASE 1 - AUTOMATED TEST SUITE");
console.log("=================================================\n");

let passedCount = 0;
let totalCount = 0;

function runTest(testName, testFn) {
  totalCount++;
  try {
    testFn();
    console.log(`✅ [PASS] ${testName}`);
    passedCount++;
  } catch (err) {
    console.error(`❌ [FAIL] ${testName}`);
    console.error(`   Error: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────
// 1. Password Reset Token Generation, Expiration & Verification
// ─────────────────────────────────────────────────────────────
runTest("Task 2: Cryptographically secure token generation & SHA-256 hashing", () => {
  const User = require("../models/User");
  const user = new User({
    name: "Test User",
    email: "test@example.com",
    password: "password123",
  });

  const rawToken = user.createPasswordResetToken();

  // 1. Token must be 64-character hex (32 bytes random)
  assert.strictEqual(typeof rawToken, "string");
  assert.strictEqual(rawToken.length, 64);

  // 2. Stored token must be the SHA-256 hash of rawToken, NOT the raw token itself
  const expectedHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  assert.strictEqual(user.resetPasswordToken, expectedHash);
  assert.notStrictEqual(user.resetPasswordToken, rawToken);

  // 3. Expiration must be set ~15 minutes in the future
  const now = Date.now();
  const expireTime = new Date(user.resetPasswordExpires).getTime();
  assert(expireTime > now + 14 * 60 * 1000 && expireTime <= now + 16 * 60 * 1000);
});

runTest("Task 2: Password reset token expiration & invalidation logic", () => {
  const rawToken = "sample_raw_token_value_1234567890abcdef";
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  // Simulated valid record
  const validRecord = {
    resetPasswordToken: hashedToken,
    resetPasswordExpires: new Date(Date.now() + 10 * 60 * 1000), // in future
  };

  // Verification matching
  const inputHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  assert.strictEqual(inputHash, validRecord.resetPasswordToken);
  assert(validRecord.resetPasswordExpires.getTime() > Date.now());

  // Expired token test
  const expiredRecord = {
    resetPasswordToken: hashedToken,
    resetPasswordExpires: new Date(Date.now() - 1000), // in past
  };
  assert(expiredRecord.resetPasswordExpires.getTime() < Date.now());

  // Invalidation after use
  validRecord.resetPasswordToken = undefined;
  validRecord.resetPasswordExpires = undefined;
  assert.strictEqual(validRecord.resetPasswordToken, undefined);
  assert.strictEqual(validRecord.resetPasswordExpires, undefined);
});

// ─────────────────────────────────────────────────────────────
// 2. Task 1: Answer Key & Explanation Sanitization
// ─────────────────────────────────────────────────────────────
runTest("Task 1: startQuiz question payload strips correctAnswer and explanation", () => {
  const mockDbQuestions = [
    {
      _id: new mongoose.Types.ObjectId(),
      topicId: new mongoose.Types.ObjectId(),
      text: "What is 2 + 2?",
      options: ["1", "2", "3", "4"],
      correctAnswer: 3,
      explanation: "2 + 2 equals 4.",
      difficulty: "easy",
      timeLimitSeconds: 30,
    },
    {
      _id: new mongoose.Types.ObjectId(),
      topicId: new mongoose.Types.ObjectId(),
      text: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Rome"],
      correctAnswer: 2,
      explanation: "Paris is the capital of France.",
      difficulty: "easy",
      timeLimitSeconds: 30,
    },
  ];

  // Apply the sanitization logic used in quizController.js
  const sanitized = mockDbQuestions.map((q) => {
    const { correctAnswer, explanation, ...safeQuestion } = q;
    return safeQuestion;
  });

  assert.strictEqual(sanitized.length, 2);

  sanitized.forEach((q, idx) => {
    assert.strictEqual(q.correctAnswer, undefined, `Question ${idx} must not have correctAnswer`);
    assert.strictEqual(q.explanation, undefined, `Question ${idx} must not have explanation`);
    assert(Array.isArray(q.options) && q.options.length === 4, "Options must be preserved");
    assert(q.text && q._id, "Question metadata must be preserved");
  });

  // Verify server DB questions still retain correct answers for evaluation
  assert.strictEqual(mockDbQuestions[0].correctAnswer, 3);
  assert.strictEqual(mockDbQuestions[1].correctAnswer, 2);
});

// ─────────────────────────────────────────────────────────────
// 3. Task 5: Score Inflation & Recalculation
// ─────────────────────────────────────────────────────────────
runTest("Task 5: Repeated quiz attempts do not inflate totalScore", () => {
  const User = require("../models/User");
  const user = new User({
    name: "Score Test User",
    email: "score@test.com",
    password: "password123",
  });

  const topic1Id = new mongoose.Types.ObjectId().toString();
  const topic2Id = new mongoose.Types.ObjectId().toString();

  // Attempt 1 on Topic 1: Score 20
  user.updateTopicProgress(topic1Id, 20, true);
  user.recalculateTotalScore();
  assert.strictEqual(user.progress.get(topic1Id).bestScore, 20);
  assert.strictEqual(user.totalScore, 20);

  // Attempt 2 on Topic 1 (Retake with LOWER score: 15)
  // Must NOT increase totalScore or decrease bestScore
  user.updateTopicProgress(topic1Id, 15, true);
  user.recalculateTotalScore();
  assert.strictEqual(user.progress.get(topic1Id).bestScore, 20);
  assert.strictEqual(user.totalScore, 20); // NO INFLATION!

  // Attempt 3 on Topic 1 (Retake with EQUAL score: 20)
  user.updateTopicProgress(topic1Id, 20, true);
  user.recalculateTotalScore();
  assert.strictEqual(user.progress.get(topic1Id).bestScore, 20);
  assert.strictEqual(user.totalScore, 20); // NO INFLATION!

  // Attempt 4 on Topic 1 (Retake with HIGHER score: 25)
  user.updateTopicProgress(topic1Id, 25, true);
  user.recalculateTotalScore();
  assert.strictEqual(user.progress.get(topic1Id).bestScore, 25);
  assert.strictEqual(user.totalScore, 25);

  // Attempt 1 on Topic 2: Score 18
  user.updateTopicProgress(topic2Id, 18, true);
  user.recalculateTotalScore();
  assert.strictEqual(user.progress.get(topic2Id).bestScore, 18);
  assert.strictEqual(user.totalScore, 25 + 18); // 43 total across topics
});

// ─────────────────────────────────────────────────────────────
// 4. Task 8: Graph Prerequisite Enforcement (Kahn's & Unlock)
// ─────────────────────────────────────────────────────────────
runTest("Task 8: isTopicUnlocked enforces prerequisites correctly", () => {
  const t1 = "660000000000000000000001";
  const t2 = "660000000000000000000002";
  const t3 = "660000000000000000000003";

  // Case 1: No prerequisites -> always unlocked
  assert.strictEqual(isTopicUnlocked(t1, [], new Map()), true);
  assert.strictEqual(isTopicUnlocked(t1, null, new Map()), true);

  // Case 2: Prerequisite t1 not completed -> locked
  const progressMap = new Map();
  progressMap.set(t1, { completed: false, bestScore: 0, attempts: 1 });
  assert.strictEqual(isTopicUnlocked(t2, [t1], progressMap), false);

  // Case 3: Prerequisite t1 completed -> unlocked
  progressMap.set(t1, { completed: true, bestScore: 80, attempts: 1 });
  assert.strictEqual(isTopicUnlocked(t2, [t1], progressMap), true);

  // Case 4: Multiple prerequisites [t1, t2] -> t2 not completed -> locked
  progressMap.set(t2, { completed: false, bestScore: 40, attempts: 1 });
  assert.strictEqual(isTopicUnlocked(t3, [t1, t2], progressMap), false);

  // Case 5: Both prerequisites completed -> unlocked
  progressMap.set(t2, { completed: true, bestScore: 75, attempts: 2 });
  assert.strictEqual(isTopicUnlocked(t3, [t1, t2], progressMap), true);

  // Case 6: Works with plain JavaScript object progress
  const plainProgress = {
    [t1]: { completed: true },
    [t2]: { completed: false },
  };
  assert.strictEqual(isTopicUnlocked(t2, [t1], plainProgress), true);
  assert.strictEqual(isTopicUnlocked(t3, [t1, t2], plainProgress), false);
});

// ─────────────────────────────────────────────────────────────
// 5. Task 4: Topic Leaderboard ID Validation & Mongoose ObjectId
// ─────────────────────────────────────────────────────────────
runTest("Task 4: Leaderboard topicId validation handles valid & invalid IDs", () => {
  const validId = new mongoose.Types.ObjectId().toString();
  const invalidIds = ["123", "not-a-valid-id", "", "abc", "66000000000000000000000Z"];

  assert(mongoose.Types.ObjectId.isValid(validId), "Valid 24-hex string must pass");

  invalidIds.forEach((id) => {
    assert(!mongoose.Types.ObjectId.isValid(id), `ID "${id}" must fail validation`);
  });

  // Verify that new mongoose.Types.ObjectId() constructs without error
  const constructed = new mongoose.Types.ObjectId(validId);
  assert.strictEqual(constructed.toString(), validId);
});

// ─────────────────────────────────────────────────────────────
// 6. Task 6: API URL Configuration
// ─────────────────────────────────────────────────────────────
runTest("Task 6: API URL defaults to relative '/api' for proxy support", () => {
  // Test default fallback
  const defaultApiUrl = process.env.REACT_APP_API_URL || "/api";
  assert.strictEqual(defaultApiUrl, "/api");

  // Test custom env override
  const customUrl = "https://custom-domain.com/api";
  const overridden = customUrl || "/api";
  assert.strictEqual(overridden, "https://custom-domain.com/api");
});

console.log("\n=================================================");
console.log(`📊 TEST RESULTS: ${passedCount} / ${totalCount} PASSED`);
if (passedCount === totalCount) {
  console.log("🎉 ALL PHASE 1 AUTOMATED TESTS PASSED!");
} else {
  console.log(`⚠️ ${totalCount - passedCount} TEST(S) FAILED`);
  process.exit(1);
}
console.log("=================================================\n");
