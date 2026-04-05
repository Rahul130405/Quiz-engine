const { computeScore } = require("../algorithms/scoring");

const testCases = [
  {
    name: "All Correct (5 questions)",
    answers: [
      { isCorrect: true, timedOut: false },
      { isCorrect: true, timedOut: false },
      { isCorrect: true, timedOut: false }, // streak 3: +4 +1 bonus
      { isCorrect: true, timedOut: false },
      { isCorrect: true, timedOut: false }, // streak 5: +4 +2 bonus
    ],
    expectedScore: (5 * 4) + 1 + 2, // 20 + 3 = 23
    expectedPercentage: 100,
  },
  {
    name: "All Wrong (3 questions)",
    answers: [
      { isCorrect: false, timedOut: false },
      { isCorrect: false, timedOut: false },
      { isCorrect: false, timedOut: false },
    ],
    expectedScore: 0, // 3 * -1 = -3, but min is 0
    expectedPercentage: 0,
  },
  {
    name: "Mixed with streaks",
    answers: [
      { isCorrect: true, timedOut: false },  // +4 (streak 1)
      { isCorrect: true, timedOut: false },  // +4 (streak 2)
      { isCorrect: true, timedOut: false },  // +4 +1 bonus (streak 3)
      { isCorrect: false, timedOut: false }, // -1 (streak 0)
      { isCorrect: true, timedOut: false },  // +4 (streak 1)
      { isCorrect: true, timedOut: false },  // +4 (streak 2)
      { isCorrect: true, timedOut: false },  // +4 +1 bonus (streak 3)
    ],
    expectedScore: (6 * 4) - 1 + 1 + 1, // 24 - 1 + 2 = 25
    expectedPercentage: (6 / 7) * 100, // 85.71
  },
  {
    name: "Streak reset at 4",
    answers: [
      { isCorrect: true, timedOut: false }, // +4 (streak 1)
      { isCorrect: true, timedOut: false }, // +4 (streak 2)
      { isCorrect: true, timedOut: false }, // +4 + 1 bonus (streak 3)
      { isCorrect: true, timedOut: false }, // +4 (streak 4)
      { isCorrect: false, timedOut: false }, // -1 (streak 0)
      { isCorrect: true, timedOut: false }, // +4 (streak 1)
    ],
    expectedScore: (5 * 4) - 1 + 1, // 20 - 1 + 1 = 20
    expectedPercentage: (5 / 6) * 100, // 83.33
  }
];

console.log("🧪 Running Scoring System Tests...\n");

testCases.forEach((tc, index) => {
  const result = computeScore(tc.answers);
  const passedScore = result.totalScore === tc.expectedScore;
  const passedPercentage = Math.abs(result.percentage - tc.expectedPercentage) < 0.01;

  console.log(`Test Case ${index + 1}: ${tc.name}`);
  console.log(`- Total Score: ${result.totalScore} (Expected: ${tc.expectedScore}) ${passedScore ? "✅" : "❌"}`);
  console.log(`- Percentage: ${result.percentage}% (Expected: ${tc.expectedPercentage.toFixed(2)}%) ${passedPercentage ? "✅" : "❌"}`);
  console.log(`- Streak Bonus: ${result.totalStreakBonus}`);
  console.log(`- Max Streak: ${result.maxStreak}`);
  console.log("------------------------------------------");
});
