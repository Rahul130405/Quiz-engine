package com.quizengine.service;

import com.quizengine.dao.XmlQuestionDao;
import com.quizengine.model.QuizAnswer;
import com.quizengine.model.QuizResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class QuizEvaluationServiceTest {

    private QuizEvaluationService evaluationService;

    @BeforeEach
    void setUp() {
        XmlQuestionDao dao = new XmlQuestionDao("data/questions.xml", "data/topics.xml", "data/quiz-schema.xsd");
        ScoringService scoringService = new ScoringService();
        evaluationService = new QuizEvaluationService(dao, scoringService);
    }

    @Test
    @DisplayName("Evaluate answers against server-side XML and calculate result")
    void testEvaluationSuccess() {
        List<QuizAnswer> answers = List.of(
                new QuizAnswer("q-html-01", 0, false, 5), // Correct: 0
                new QuizAnswer("q-html-02", 2, false, 8), // Correct: 2
                new QuizAnswer("q-html-03", 3, false, 12) // Correct: 3
        );

        QuizResult result = evaluationService.evaluate("topic-html", answers);

        assertNotNull(result);
        assertEquals("topic-html", result.getTopicId());
        assertEquals(3, result.getCorrectCount());
        assertEquals(0, result.getWrongCount());
        assertEquals(100.0, result.getPercentage());
        assertTrue(result.isPassed());
        // Streak 3: 4 + 4 + (4 + 1) = 13
        assertEquals(13, result.getScore());
        assertEquals(13, result.getMaxPossibleScore());
        assertEquals(1, result.getTotalStreakBonus());
        assertEquals(3, result.getHistory().size());
        assertEquals("HTML stands for HyperText Markup Language. It is the standard language used to create and structure content on the web.",
                result.getHistory().get(0).getExplanation());
    }

    @Test
    @DisplayName("14. Invalid request handling rejects empty answers and out-of-bounds options")
    void testInvalidRequestHandling() {
        // Null or empty list
        assertThrows(IllegalArgumentException.class, () -> {
            evaluationService.evaluate("topic-html", null);
        });

        assertThrows(IllegalArgumentException.class, () -> {
            evaluationService.evaluate("topic-html", new ArrayList<>());
        });

        // Option index out of range (> 3)
        List<QuizAnswer> outOfBoundsAnswers = List.of(
                new QuizAnswer("q-html-01", 99, false, 10)
        );
        assertThrows(IllegalArgumentException.class, () -> {
            evaluationService.evaluate("topic-html", outOfBoundsAnswers);
        }, "Must reject option index > 3");

        // Option index < -1
        List<QuizAnswer> negativeOptionAnswers = List.of(
                new QuizAnswer("q-html-01", -5, false, 10)
        );
        assertThrows(IllegalArgumentException.class, () -> {
            evaluationService.evaluate("topic-html", negativeOptionAnswers);
        }, "Must reject option index < -1");
    }

    @Test
    @DisplayName("15. Missing question handling throws exception for unknown question IDs")
    void testMissingQuestionHandling() {
        List<QuizAnswer> unknownQuestion = List.of(
                new QuizAnswer("q-non-existent-999", 0, false, 5)
        );

        Exception ex = assertThrows(IllegalArgumentException.class, () -> {
            evaluationService.evaluate("topic-html", unknownQuestion);
        });

        assertTrue(ex.getMessage().contains("Question not found"), "Error must state question not found");
    }
}
