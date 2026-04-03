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
    const prereqIds = topic.prerequisites.map((p) => p._id.toString());
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

    // Strip the correct answer before sending to client!
    const sanitized = selected;

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
    const isNewBest = scoring.totalScore > existingProgress.bestScore;

    user.updateTopicProgress(topicId, scoring.totalScore, passed);

    // Add to total score (only the increment, not replacing)
    user.totalScore = (user.totalScore || 0) + scoring.totalScore;
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

module.exports = { startQuiz, submitQuiz, getHistory };
