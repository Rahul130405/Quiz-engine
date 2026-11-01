const crypto = require("crypto");
const mongoose = require("mongoose");
const Question = require("../models/Question");
const QuizAttempt = require("../models/QuizAttempt");
const User = require("../models/User");
const Topic = require("../models/Topic");
const { pickRandom } = require("../algorithms/shuffle");
const { sortQuestionsByDifficulty } = require("../algorithms/sorting");
const { computeScore } = require("../algorithms/scoring");
const { isTopicUnlocked } = require("../algorithms/graph");

/**
 * POST /api/quiz/start
 * Returns a shuffled set of questions for a topic.
 * Requires: topicId, optional count (default 10), optional sortByDifficulty
 */
const startQuiz = async (req, res) => {
  try {
    const { topicId, count = 10, sortByDifficulty = false } = req.body;

    // Verify topic exists
    const topic = await Topic.findById(topicId).populate("prerequisites");
    if (!topic) return res.status(404).json({ error: "Topic not found" });

    // Check user's progress to see if topic is unlocked
    const user = await User.findById(req.user._id);
    const prereqIds = (topic.prerequisites || []).map((p) =>
      p && p._id ? p._id.toString() : p.toString()
    );
    if (!isTopicUnlocked(topicId, prereqIds, user.progress)) {
      return res.status(403).json({ error: "Complete prerequisites first to unlock this topic" });
    }

    // Fetch all questions for this topic
    let allQuestions = await Question.find({ topicId }).lean();

    if (allQuestions.length === 0) {
      return res.status(404).json({ error: "No questions found for this topic" });
    }

    // ── Fisher–Yates shuffle first ─────────────────────────────────────────
    let selected = pickRandom(allQuestions, count);

    // ── Optionally sort by difficulty (easy → hard) ────────────────────────
    if (sortByDifficulty) {
      selected = sortQuestionsByDifficulty(selected);
    }

    // Strip the correct answer and sensitive explanation before sending to client!
    const sanitized = selected.map((q) => {
      const { correctAnswer, explanation, ...safeQuestion } = q;
      return safeQuestion;
    });

    res.json({
      topic: { id: topic._id, name: topic.name, icon: topic.icon },
      questions: sanitized,
      totalQuestions: sanitized.length,
      sessionId: `${req.user._id}_${topicId}_${Date.now()}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/quiz/submit
 * Grade a completed quiz, compute score, update user progress.
 *
 * Body: { topicId, answers: [{ questionId, selectedOption, timedOut, timeTakenSeconds }] }
 */
const submitQuiz = async (req, res) => {
  try {
    const { topicId, answers, timeTakenSeconds = 0 } = req.body;

    if (!answers || answers.length === 0) {
      return res.status(400).json({ error: "No answers submitted" });
    }

    // Fetch the real questions to check answers
    const questionIds = answers.map((a) => a.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } }).lean();
    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    // ── Grade each answer ──────────────────────────────────────────────────
    const gradedAnswers = answers.map((ans) => {
      const question = questionMap.get(ans.questionId?.toString());
      const isCorrect = question
        ? ans.selectedOption === question.correctAnswer
        : false;

      return {
        questionId: ans.questionId,
        selectedOption: ans.selectedOption ?? -1,
        isCorrect,
        timedOut: ans.timedOut ?? false,
        timeTakenSeconds: ans.timeTakenSeconds ?? 0,
      };
    });

    // ── Run greedy scoring algorithm ───────────────────────────────────────
    const scoring = computeScore(gradedAnswers);

    // Determine pass/fail against topic's passing threshold
    const topic = await Topic.findById(topicId);
    const passed = scoring.percentage >= (topic?.passingScore ?? 60);

    // ── Save attempt to DB ─────────────────────────────────────────────────
    const attempt = await QuizAttempt.create({
      userId: req.user._id,
      topicId,
      score: scoring.totalScore,
      maxPossibleScore: scoring.maxPossibleScore,
      percentage: scoring.percentage,
      passed,
      timeTakenSeconds,
      streakBonus: scoring.totalStreakBonus,
      answers: scoring.history.map((h, i) => ({
        questionId: gradedAnswers[i].questionId,
        selectedOption: gradedAnswers[i].selectedOption,
        isCorrect: gradedAnswers[i].isCorrect,
        timeTakenSeconds: gradedAnswers[i].timeTakenSeconds,
        scoreChange: h.scoreChange,
      })),
    });

    // ── Update user's total score and topic progress ───────────────────────
    const user = await User.findById(req.user._id);
    const existingProgress = user.progress.get(topicId) || { bestScore: 0 };
    const isNewBest = scoring.totalScore > (existingProgress.bestScore || 0);

    user.updateTopicProgress(topicId, scoring.totalScore, passed);

    // Recalculate totalScore as sum of bestScores across all topics to prevent inflation on retakes
    if (typeof user.recalculateTotalScore === "function") {
      user.recalculateTotalScore();
    } else {
      let sumBest = 0;
      if (user.progress && user.progress instanceof Map) {
        for (const [_, item] of user.progress) {
          sumBest += item.bestScore || 0;
        }
      }
      user.totalScore = sumBest;
    }
    await user.save();

    // Send back full results with correct answers revealed
    const enrichedHistory = scoring.history.map((h, i) => {
      const q = questionMap.get(gradedAnswers[i].questionId?.toString());
      return {
        ...h,
        correctAnswer: q?.correctAnswer,
        explanation: q?.explanation,
        questionText: q?.text,
      };
    });

    res.json({
      attemptId: attempt._id,
      score: scoring.totalScore,
      maxPossibleScore: scoring.maxPossibleScore,
      percentage: scoring.percentage,
      passed,
      correctCount: scoring.correctCount,
      wrongCount: scoring.wrongCount,
      maxStreak: scoring.maxStreak,
      totalStreakBonus: scoring.totalStreakBonus,
      history: enrichedHistory,
      newTotalScore: user.totalScore,
      isNewBest,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/quiz/record-attempt
 * Secure server-to-server bridge for recording Java-evaluated quiz results in MongoDB.
 * Protected by protect middleware (Bearer JWT required).
 */
const recordAttempt = async (req, res) => {
  try {
    const {
      topicId,
      score,
      maxPossibleScore,
      percentage,
      passed,
      timeTakenSeconds,
      streakBonus,
      answers,
      submissionId,
    } = req.body;

    if (!topicId || score === undefined || percentage === undefined) {
      return res.status(400).json({ error: "Missing required evaluation fields" });
    }

    const userId = req.user._id.toString();
    const internalSecret = process.env.INTERNAL_SERVICE_SECRET || process.env.JWT_SECRET;
    const internalSignature = req.headers["x-internal-service"];
    const timestampStr = req.headers["x-internal-timestamp"] || req.body.timestamp;

    if (!internalSignature) {
      return res.status(403).json({
        error: "Forbidden: Missing authoritative service signature.",
      });
    }

    if (!timestampStr) {
      return res.status(403).json({
        error: "Forbidden: Missing internal request timestamp.",
      });
    }

    // Replay & Expiration Window Verification (5-minute maximum tolerance for fresh submissions)
    const reqTimestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    const ageMs = now - reqTimestamp;
    const isTimestampFresh = !isNaN(reqTimestamp) && ageMs <= 5 * 60 * 1000 && ageMs >= -30 * 1000;

    // Construct canonical representation of answers
    const answersStr = (answers || [])
      .map((a) => `${a.questionId}:${a.selectedOption ?? a.selectedAnswer ?? -1}:${Boolean(a.isCorrect)}`)
      .join(";");
    const answersHash = crypto.createHash("sha256").update(answersStr).digest("hex");

    const formattedPct = Number(percentage).toFixed(2);
    const canonicalString = `${submissionId || ""}|${userId}|${topicId}|${score}|${formattedPct}|${Boolean(passed)}|${timestampStr}|${answersHash}`;

    const expectedSignature = crypto
      .createHmac("sha256", internalSecret)
      .update(canonicalString)
      .digest("hex");

    // Constant-time signature comparison to eliminate timing side-channels
    const sigBuf = Buffer.from(String(internalSignature), "hex");
    const expBuf = Buffer.from(expectedSignature, "hex");
    const isValidSignature = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);

    if (!isValidSignature) {
      return res.status(403).json({
        error: "Forbidden: Invalid internal service signature. Payload modification or tampering detected.",
      });
    }

    // Idempotency check: retrieve existing attempt if this is a legitimate retry
    if (submissionId) {
      const existing = await QuizAttempt.findOne({ userId: req.user._id, submissionId });
      if (existing) {
        return res.json({
          attemptId: existing._id,
          message: "Attempt already recorded",
          newTotalScore: req.user.totalScore,
          isNewBest: false,
        });
      }
    }

    // If attempt does not already exist, enforce strict timestamp freshness
    if (!isTimestampFresh) {
      return res.status(403).json({
        error: "Forbidden: Request signature has expired or timestamp skew is unacceptable.",
      });
    }

    // Try to resolve matching MongoDB Topic document if topicId is a string
    let resolvedTopicId = topicId;
    if (!mongoose.Types.ObjectId.isValid(topicId)) {
      let mongoTopic = null;
      if (topicId.includes("html")) {
        mongoTopic = await Topic.findOne({ name: /HTML/i });
      } else if (topicId.includes("daa")) {
        mongoTopic = await Topic.findOne({ name: /Design|DAA/i });
      } else if (topicId.includes("java")) {
        mongoTopic = await Topic.findOne({ name: /Java/i });
      }
      if (mongoTopic) {
        resolvedTopicId = mongoTopic._id;
      }
    }

    // Create QuizAttempt with database-level uniqueness guarantee
    const attempt = await QuizAttempt.create({
      userId,
      submissionId,
      topicId: resolvedTopicId,
      score,
      maxPossibleScore: maxPossibleScore || score,
      percentage,
      passed: Boolean(passed),
      timeTakenSeconds: timeTakenSeconds || 0,
      streakBonus: streakBonus || 0,
      answers: (answers || []).map((a) => ({
        questionId: a.questionId,
        selectedOption: a.selectedOption ?? a.selectedAnswer ?? -1,
        isCorrect: a.isCorrect,
        timeTakenSeconds: a.timeSpentSeconds || a.timeTakenSeconds || 0,
        scoreChange: a.scoreChange || 0,
      })),
    });

    // Update User Progress & recalculate total score (Phase 1 semantics)
    const user = await User.findById(userId);
    if (user) {
      const topicKey = String(resolvedTopicId);
      user.updateTopicProgress(topicKey, score, passed);
      if (String(topicId) !== topicKey) {
        user.updateTopicProgress(String(topicId), score, passed);
      }

      if (typeof user.recalculateTotalScore === "function") {
        user.recalculateTotalScore();
      } else {
        let sumBest = 0;
        if (user.progress && user.progress instanceof Map) {
          for (const [_, item] of user.progress) {
            sumBest += item.bestScore || 0;
          }
        }
        user.totalScore = sumBest;
      }
      await user.save();

      return res.status(201).json({
        attemptId: attempt._id,
        newTotalScore: user.totalScore,
        isNewBest: true,
      });
    }

    res.status(201).json({
      attemptId: attempt._id,
      newTotalScore: score,
      isNewBest: true,
    });
  } catch (err) {
    // Handle concurrent duplicate submission race conditions caught by database unique index
    if (err.code === 11000 && req.body?.submissionId) {
      try {
        const existing = await QuizAttempt.findOne({ userId: req.user._id, submissionId: req.body.submissionId });
        if (existing) {
          return res.json({
            attemptId: existing._id,
            message: "Attempt already recorded",
            newTotalScore: req.user.totalScore,
            isNewBest: false,
          });
        }
      } catch (_) {}
    }
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/quiz/history
 * Return the authenticated user's past quiz attempts
 */
const getHistory = async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ userId: req.user._id })
      .populate("topicId", "name icon color")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({ attempts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { startQuiz, submitQuiz, recordAttempt, getHistory };
