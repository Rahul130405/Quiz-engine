/**
 * ─────────────────────────────────────────────────────
 *  SIMPLE SCORING SYSTEM (NO STREAKS)
 * ─────────────────────────────────────────────────────
 *
 * Rules:
 *   ✅ Correct answer: +5 points
 *   ❌ Wrong answer:   -1 point
 *   ⏰ Timeout:        0 points
 */

const POINTS = {
  CORRECT: 5,
  WRONG: -1,
  TIMEOUT: 0,
};

class ScoreEngine {
  constructor() {
    this.totalScore = 0;
    this.history = [];
  }

  recordAnswer(result, questionId) {
    let change = 0;

    if (result === "correct") {
      change = POINTS.CORRECT;
    } else if (result === "wrong") {
      change = POINTS.WRONG;
    } else {
      change = POINTS.TIMEOUT;
    }

    this.totalScore = Math.max(0, this.totalScore + change);

    const record = {
      questionId,
      result,
      scoreChange: change,
      totalScore: this.totalScore,
    };

    this.history.push(record);
    return record;
  }

  getSummary(totalQuestions) {
    const correctCount = this.history.filter(h => h.result === "correct").length;
    const wrongCount   = this.history.filter(h => h.result === "wrong").length;
    const timeoutCount = this.history.filter(h => h.result === "timeout").length;

    return {
      totalScore: this.totalScore,
      maxPossibleScore: totalQuestions * POINTS.CORRECT,

      // ✅ FIXED: percentage based on correctness
      percentage: Math.round((correctCount / totalQuestions) * 100),

      correctCount,
      wrongCount,
      timeoutCount,

      // removed streaks
      maxStreak: 0,
      totalStreakBonus: 0,

      history: this.history,
    };
  }
}

function computeScore(answers) {
  const engine = new ScoreEngine();

  answers.forEach((ans, i) => {
    const result = ans.timedOut
      ? "timeout"
      : ans.isCorrect
      ? "correct"
      : "wrong";

    engine.recordAnswer(result, ans.questionId || `q${i}`);
  });

  return engine.getSummary(answers.length);
}

module.exports = { ScoreEngine, computeScore, POINTS };