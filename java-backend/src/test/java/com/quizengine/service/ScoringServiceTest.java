package com.quizengine.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ScoringServiceTest {

    private ScoringService scoringService;

    @BeforeEach
    void setUp() {
        scoringService = new ScoringService();
    }

    @Test
    @DisplayName("8 & 10. Correct answer evaluation and streak bonuses (Matches Node test case 1)")
    void testAllCorrectStreakBonus() {
        // 5 questions, all correct:
        // q1: +4 (streak 1)
        // q2: +4 (streak 2)
        // q3: +4 + 1 bonus (streak 3) -> 13
        // q4: +4 (streak 4) -> 17
        // q5: +4 + 2 bonus (streak 5) -> 23
        ScoringService.ScoreState state = scoringService.createScoreState();

        for (int i = 0; i < 5; i++) {
            state.recordAnswer(true, false);
        }

        assertEquals(23, state.getTotalScore(), "Total score must be 23 for 5 correct in a row");
        assertEquals(100.0, state.calculatePercentage(5), "Percentage must be 100%");
        assertEquals(3, state.getTotalStreakBonus(), "Total streak bonus must be 1 + 2 = 3");
        assertEquals(5, state.getMaxStreak(), "Max streak must be 5");
    }

    @Test
    @DisplayName("9 & 11. Incorrect answer evaluation and minimum score protection (Matches Node test case 2)")
    void testAllWrongMinimumScoreZero() {
        // 3 questions, all wrong:
        // q1: -1, min 0 -> 0
        // q2: -1, min 0 -> 0
        // q3: -1, min 0 -> 0
        ScoringService.ScoreState state = scoringService.createScoreState();

        for (int i = 0; i < 3; i++) {
            state.recordAnswer(false, false);
        }

        assertEquals(0, state.getTotalScore(), "Score must never drop below 0");
        assertEquals(0.0, state.calculatePercentage(3));
        assertEquals(0, state.getMaxStreak());
        assertEquals(0, state.getTotalStreakBonus());
    }

    @Test
    @DisplayName("Streak reset on wrong answer (Matches Node test case 3)")
    void testMixedWithStreaks() {
        // 7 questions:
        // +4, +4, +4 + 1 (streak 3) -> 13
        // -1 (wrong, streak reset) -> 12
        // +4, +4, +4 + 1 (streak 3) -> 25
        ScoringService.ScoreState state = scoringService.createScoreState();

        state.recordAnswer(true, false);  // +4
        state.recordAnswer(true, false);  // +4
        state.recordAnswer(true, false);  // +4 + 1 bonus
        state.recordAnswer(false, false); // -1 (streak 0)
        state.recordAnswer(true, false);  // +4
        state.recordAnswer(true, false);  // +4
        state.recordAnswer(true, false);  // +4 + 1 bonus

        assertEquals(25, state.getTotalScore(), "Expected score: 24 - 1 + 2 = 25");
        assertEquals(85.71, state.calculatePercentage(7), "6/7 correct = 85.71%");
        assertEquals(2, state.getTotalStreakBonus(), "Streak bonus = 1 + 1 = 2");
        assertEquals(3, state.getMaxStreak());
    }

    @Test
    @DisplayName("Streak reset at 4 (Matches Node test case 4)")
    void testStreakResetAt4() {
        // 6 questions:
        // +4 (1), +4 (2), +4+1 (3), +4 (4), -1 (wrong -> 0), +4 (1)
        // Score: 20 - 1 + 1 = 20
        ScoringService.ScoreState state = scoringService.createScoreState();

        state.recordAnswer(true, false);
        state.recordAnswer(true, false);
        state.recordAnswer(true, false); // bonus +1
        state.recordAnswer(true, false);
        state.recordAnswer(false, false);
        state.recordAnswer(true, false);

        assertEquals(20, state.getTotalScore(), "Expected score: 20");
        assertEquals(83.33, state.calculatePercentage(6), "5/6 correct = 83.33%");
        assertEquals(1, state.getTotalStreakBonus(), "Streak bonus = 1");
        assertEquals(4, state.getMaxStreak());
    }

    @Test
    @DisplayName("Timeout handling allocates 0 points and preserves streak neutrality")
    void testTimeoutHandling() {
        ScoringService.ScoreState state = scoringService.createScoreState();
        state.recordAnswer(true, false); // +4, streak 1
        state.recordAnswer(false, true); // timeout: 0 points
        assertEquals(4, state.getTotalScore());
        assertEquals(1, state.getTimeoutCount());
    }

    @Test
    @DisplayName("Mathematical consistency of maxPossibleScore and percentage semantics")
    void testMaxPossibleScoreAndPercentageSemantics() {
        ScoringService.ScoreState state = scoringService.createScoreState();

        // Bounds testing on maxPossibleScore
        assertEquals(0, state.calculateMaxPossibleScore(0));
        assertEquals(8, state.calculateMaxPossibleScore(2));  // 2 * 4 = 8 (streak bonus unreachable)
        assertEquals(13, state.calculateMaxPossibleScore(3)); // 3 * 4 + 1 = 13 (streak 3 reachable)
        assertEquals(17, state.calculateMaxPossibleScore(4)); // 4 * 4 + 1 = 17
        assertEquals(23, state.calculateMaxPossibleScore(5)); // 5 * 4 + 3 = 23 (streak 3 & 5 reachable)
        assertEquals(43, state.calculateMaxPossibleScore(10)); // 10 * 4 + 3 = 43

        // Percentage semantics
        assertEquals(0.0, state.calculatePercentage(0));
        state.recordAnswer(true, false);
        state.recordAnswer(true, false);
        assertEquals(100.0, state.calculatePercentage(2));
    }
}
