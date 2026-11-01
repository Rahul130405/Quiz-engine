package com.quizengine.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * ScoringService implements the exact greedy scoring model with streak bonuses
 * matching the QuizEngine Node.js scoring implementation.
 *
 * Rules:
 *  - Correct Answer: +4 points
 *  - Incorrect Answer: -1 point
 *  - Timeout: 0 points
 *  - Minimum Total Score: 0 (cannot drop below zero)
 *  - Streak Bonuses:
 *      - 3 correct in a row: +1 bonus point
 *      - 5 correct in a row: +2 bonus points
 *  - Streak resets to 0 on any incorrect answer
 */
public class ScoringService {

    public static final int POINTS_CORRECT = 4;
    public static final int POINTS_WRONG = -1;
    public static final int POINTS_TIMEOUT = 0;

    public static class ScoreState {
        private int totalScore = 0;
        private int currentStreak = 0;
        private int maxStreak = 0;
        private int totalStreakBonus = 0;
        private int correctCount = 0;
        private int wrongCount = 0;
        private int timeoutCount = 0;
        private final List<Record> records = new ArrayList<>();

        public static class Record {
            public final String result; // "correct", "wrong", "timeout"
            public final int baseChange;
            public final int streakBonus;
            public final int scoreChange; // baseChange + streakBonus
            public final int totalScore;
            public final int currentStreak;

            public Record(String result, int baseChange, int streakBonus, int scoreChange, int totalScore, int currentStreak) {
                this.result = result;
                this.baseChange = baseChange;
                this.streakBonus = streakBonus;
                this.scoreChange = scoreChange;
                this.totalScore = totalScore;
                this.currentStreak = currentStreak;
            }
        }

        public Record recordAnswer(boolean isCorrect, boolean isTimedOut) {
            String result;
            int baseChange;
            int streakBonus = 0;

            if (isTimedOut) {
                result = "timeout";
                baseChange = POINTS_TIMEOUT;
                timeoutCount++;
                // Streak is neutral on timeout
            } else if (isCorrect) {
                result = "correct";
                baseChange = POINTS_CORRECT;
                correctCount++;
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);

                // Apply streak bonuses at exact milestones
                if (currentStreak == 3) {
                    streakBonus = 1;
                } else if (currentStreak == 5) {
                    streakBonus = 2;
                }
            } else {
                result = "wrong";
                baseChange = POINTS_WRONG;
                wrongCount++;
                currentStreak = 0; // Reset streak on wrong answer
            }

            int totalChange = baseChange + streakBonus;
            totalScore = Math.max(0, totalScore + totalChange);
            totalStreakBonus += streakBonus;

            Record r = new Record(result, baseChange, streakBonus, totalChange, totalScore, currentStreak);
            records.add(r);
            return r;
        }

        public int getTotalScore() { return totalScore; }
        public int getCurrentStreak() { return currentStreak; }
        public int getMaxStreak() { return maxStreak; }
        public int getTotalStreakBonus() { return totalStreakBonus; }
        public int getCorrectCount() { return correctCount; }
        public int getWrongCount() { return wrongCount; }
        public int getTimeoutCount() { return timeoutCount; }
        public List<Record> getRecords() { return records; }

        /**
         * Calculates accuracy percentage: (correctCount / totalQuestions) * 100.0, rounded to 2 decimal places.
         * Matches the Node.js backend/algorithms/scoring.js specification.
         */
        public double calculatePercentage(int totalQuestions) {
            if (totalQuestions <= 0) return 0.0;
            double pct = ((double) correctCount / totalQuestions) * 100.0;
            return BigDecimal.valueOf(pct)
                    .setScale(2, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        /**
         * Calculates the mathematically exact maximum possible score achievable for a given number of questions.
         * Streak bonuses trigger exclusively at streak == 3 (+1) and streak == 5 (+2).
         * - For N < 3: max streak bonus = 0
         * - For 3 <= N < 5: max streak bonus = 1
         * - For N >= 5: max streak bonus = 3
         */
        public int calculateMaxPossibleScore(int totalQuestions) {
            if (totalQuestions <= 0) return 0;
            int maxBonus = 0;
            if (totalQuestions >= 5) {
                maxBonus = 3;
            } else if (totalQuestions >= 3) {
                maxBonus = 1;
            }
            return (totalQuestions * POINTS_CORRECT) + maxBonus;
        }
    }

    public ScoreState createScoreState() {
        return new ScoreState();
    }
}
