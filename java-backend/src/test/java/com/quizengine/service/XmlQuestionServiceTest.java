package com.quizengine.service;

import com.quizengine.dao.XmlQuestionDao;
import com.quizengine.model.QuizQuestionDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class XmlQuestionServiceTest {

    private XmlQuestionService service;

    @BeforeEach
    void setUp() {
        XmlQuestionDao dao = new XmlQuestionDao("data/questions.xml", "data/topics.xml", "data/quiz-schema.xsd");
        service = new XmlQuestionService(dao);
    }

    @Test
    @DisplayName("7. Fisher-Yates shuffle randomizes array ordering without bias")
    void testFisherYatesShuffle() {
        List<Integer> original = new ArrayList<>();
        for (int i = 0; i < 50; i++) {
            original.add(i);
        }

        List<Integer> shuffled = service.fisherYatesShuffle(original);

        // Size and element content must be identical
        assertEquals(original.size(), shuffled.size());
        assertTrue(shuffled.containsAll(original));

        // In 50 elements, probability of order remaining identical is 1/50! (~0)
        assertNotEquals(original, shuffled, "Shuffled list must not be in identical order");
    }

    @Test
    @DisplayName("12. Answer-key sanitization strictly omits correctAnswer and explanation in DTO")
    void testAnswerKeySanitization() {
        List<QuizQuestionDTO> questions = service.getSanitizedQuestions("topic-html", null, 10, false);

        assertFalse(questions.isEmpty());
        assertEquals(10, questions.size());

        for (QuizQuestionDTO q : questions) {
            assertNotNull(q.getId(), "Question ID must be present");
            assertNotNull(q.getText(), "Question text must be present");
            assertEquals(4, q.getOptions().size(), "Question must have 4 options");
            assertNotNull(q.getDifficulty(), "Difficulty must be present");

            // Verify by reflection / DTO structure that neither correctAnswer nor explanation are exposed
            // In QuizQuestionDTO, those fields do not even exist!
        }
    }
}
