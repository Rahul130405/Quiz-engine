/**
 * ─────────────────────────────────────────────────────
 *  UPDATED SCORING SYSTEM (WITH STREAKS)
 * ─────────────────────────────────────────────────────
 *
 * Rules:
 *   ✅ Correct answer: +4 points
 *   ❌ Wrong answer:   -1 point
 *   🔥 Streak bonus:
 *      3 in a row → +1 bonus
 *      5 in a row → +2 bonus
 */

const POINTS = {
  CORRECT: 4,
  WRONG: -1,
  TIMEOUT: 0,
};

class ScoreEngine {
  constructor() {
    this.totalScore = 0;
    this.currentStreak = 0;
    this.maxStreak = 0;
    this.totalStreakBonus = 0;
    this.history = [];
  }

  recordAnswer(result, questionId) {
    let baseChange = 0;
    let streakBonus = 0;

    if (result === "correct") {
      baseChange = POINTS.CORRECT;
      this.currentStreak += 1;
      this.maxStreak = Math.max(this.maxStreak, this.currentStreak);

      // Apply bonus only on exact streak counts
      if (this.currentStreak === 3) {
        streakBonus = 1;
      } else if (this.currentStreak === 5) {
        streakBonus = 2;
      }
    } else if (result === "wrong") {
      baseChange = POINTS.WRONG;
      this.currentStreak = 0; // Reset streak on wrong answer
    } else {
      baseChange = POINTS.TIMEOUT;
      // Streak is not broken or increased on timeout (or it could be, let's keep it neutral as per usual quiz rules unless specified)
      // Actually, standard behavior is usually breaking streak on timeout. 
      // User said "Reset streak to 0 when the answer is wrong."
      // We will follow instructions strictly.
    }

    const totalChange = baseChange + streakBonus;
    this.totalScore = Math.max(0, this.totalScore + totalChange);
    this.totalStreakBonus += streakBonus;

    const record = {
      questionId,
      result,
      scoreChange: totalChange,
      baseChange,
      streakBonus,
      totalScore: this.totalScore,
      currentStreak: this.currentStreak,
    };

    this.history.push(record);
    return record;
  }

  getSummary(totalQuestions) {
    const correctCount = this.history.filter((h) => h.result === "correct").length;
    const wrongCount = this.history.filter((h) => h.result === "wrong").length;
    const timeoutCount = this.history.filter((h) => h.result === "timeout").length;

    // Accuracy calculation: (Correct / Total) * 100
    // Using simple division and multiplying by 100.
    const percentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    return {
      totalScore: this.totalScore,
      maxPossibleScore: totalQuestions * POINTS.CORRECT + 3, // +1 (at 3) +2 (at 5) = 3 total bonus possible per 5-streak

      percentage: parseFloat(percentage.toFixed(2)), // Keep 2 decimal places for accuracy

      correctCount,
      wrongCount,
      timeoutCount,

      maxStreak: this.maxStreak,
      totalStreakBonus: this.totalStreakBonus,

      history: this.history,
    };
  }
}

function computeScore(answers) {
  const engine = new ScoreEngine();

  answers.forEach((ans, i) => {
    const result = ans.timedOut ? "timeout" : ans.isCorrect ? "correct" : "wrong";

    engine.recordAnswer(result, ans.questionId || `q${i}`);
  });

  return engine.getSummary(answers.length);
}

module.exports = { ScoreEngine, computeScore, POINTS };