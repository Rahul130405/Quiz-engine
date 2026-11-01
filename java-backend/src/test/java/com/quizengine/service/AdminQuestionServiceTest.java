package com.quizengine.service;

import com.quizengine.dao.XmlQuestionDao;
import com.quizengine.model.Question;
import com.quizengine.model.Topic;
import org.junit.jupiter.api.*;

import java.io.File;
import java.nio.file.Files;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AdminQuestionServiceTest {

    private static File testDataDir;
    private static XmlQuestionDao testDao;
    private static AdminQuestionService adminService;

    @BeforeAll
    static void setUp() throws Exception {
        // Create temporary isolated XML test directory to avoid modifying production data
        testDataDir = Files.createTempDirectory("quizengine-test-data-").toFile();

        File srcQuestions = new File("data/questions.xml");
        File srcTopics = new File("data/topics.xml");
        File srcXsd = new File("data/quiz-schema.xsd");

        File destQuestions = new File(testDataDir, "questions.xml");
        File destTopics = new File(testDataDir, "topics.xml");
        File destXsd = new File(testDataDir, "quiz-schema.xsd");

        Files.copy(srcQuestions.toPath(), destQuestions.toPath());
        Files.copy(srcTopics.toPath(), destTopics.toPath());
        Files.copy(srcXsd.toPath(), destXsd.toPath());

        testDao = new XmlQuestionDao(destQuestions.getAbsolutePath(), destTopics.getAbsolutePath(), destXsd.getAbsolutePath());
        adminService = new AdminQuestionService(testDao);
    }

    @AfterAll
    static void tearDown() {
        if (testDataDir != null && testDataDir.exists()) {
            File[] files = testDataDir.listFiles();
            if (files != null) {
                for (File f : files) f.delete();
            }
            testDataDir.delete();
        }
    }

    @Test
    @Order(1)
    @DisplayName("7. Dashboard statistics calculations from XML")
    void testDashboardStatistics() {
        Map<String, Object> stats = adminService.getDashboardStats();

        assertNotNull(stats);
        assertEquals(60, stats.get("totalQuestions"), "Total questions must be 60");
        assertEquals(3, stats.get("totalTopics"), "Total topics must be 3");
        assertEquals(30L, stats.get("easyQuestions"), "Easy questions count");
        assertEquals(25L, stats.get("mediumQuestions"), "Medium questions count");
        assertEquals(5L, stats.get("hardQuestions"), "Hard questions count");
        assertTrue((Boolean) stats.get("datastoreHealthy"), "Datastore must be healthy");
        assertNotNull(stats.get("lastLoadedTime"));

        List<?> breakdown = (List<?>) stats.get("topicBreakdown");
        assertEquals(3, breakdown.size());
    }

    @Test
    @Order(2)
    @DisplayName("8 & 9. Question listing, search, topic filter, and pagination")
    void testSearchAndFiltering() {
        // Test 1: Full listing pagination (page 1, 10 items)
        var result1 = adminService.searchAndFilterQuestions(null, null, null, 1, 10);
        assertEquals(10, result1.getItems().size());
        assertEquals(60, result1.getTotalItems());
        assertEquals(6, result1.getTotalPages());
        assertTrue(result1.hasNext());
        assertFalse(result1.hasPrevious());

        // Test 2: Search by ID
        var resultId = adminService.searchAndFilterQuestions("q-html-05", null, null, 1, 10);
        assertEquals(1, resultId.getTotalItems());
        assertEquals("q-html-05", resultId.getItems().get(0).getId());

        // Test 3: Search by keyword in question text
        var resultText = adminService.searchAndFilterQuestions("HTML", null, null, 1, 10);
        assertTrue(resultText.getTotalItems() >= 1);

        // Test 4: Filter by topic
        var resultTopic = adminService.searchAndFilterQuestions(null, "topic-daa", null, 1, 50);
        assertEquals(20, resultTopic.getTotalItems());
        for (Question q : resultTopic.getItems()) {
            assertEquals("topic-daa", q.getTopicId());
        }

        // Test 5: Filter by difficulty
        var resultDiff = adminService.searchAndFilterQuestions(null, null, "hard", 1, 50);
        assertEquals(5, resultDiff.getTotalItems());
        for (Question q : resultDiff.getItems()) {
            assertEquals("hard", q.getDifficulty());
        }

        // Test 6: Combined filter
        var resultCombined = adminService.searchAndFilterQuestions(null, "topic-html", "easy", 1, 50);
        assertEquals(8, resultCombined.getTotalItems());
    }

    @Test
    @Order(3)
    @DisplayName("10. Question creation with XML and XSD persistence")
    void testQuestionCreation() throws Exception {
        Question newQ = new Question(
                "q-test-create-01",
                "topic-html",
                "What is the semantic purpose of the main element?",
                List.of("Navigation menu", "Dominant content of the document", "Footer copyright", "Sidebar links"),
                1,
                "easy",
                "The <main> tag represents the dominant content of the <body>.",
                30
        );

        adminService.createQuestion(newQ);

        // Verify loaded in memory and DAO
        Optional<Question> retrieved = adminService.getQuestionById("q-test-create-01");
        assertTrue(retrieved.isPresent());
        assertEquals("q-test-create-01", retrieved.get().getId());
        assertEquals(61, testDao.getQuestionCount(), "Question count should increment to 61");
    }

    @Test
    @Order(4)
    @DisplayName("11. Duplicate question rejection enforces ID uniqueness")
    void testDuplicateQuestionRejection() {
        Question duplicate = new Question(
                "q-test-create-01",
                "topic-html",
                "Another question with duplicate ID",
                List.of("A", "B", "C", "D"),
                0,
                "easy",
                "Explanation",
                25
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            adminService.createQuestion(duplicate);
        });

        assertTrue(ex.getMessage().contains("Question ID already exists"), "Error message must state duplicate ID");
    }

    @Test
    @Order(5)
    @DisplayName("12. Question editing preserves identity and updates XML")
    void testQuestionEditing() throws Exception {
        Question updated = new Question(
                "q-test-create-01",
                "topic-html",
                "What is the updated semantic purpose of the main tag?",
                List.of("Option A", "Updated Dominant Content", "Option C", "Option D"),
                1,
                "medium",
                "Updated pedagogical explanation.",
                45
        );

        adminService.updateQuestion(updated);

        Optional<Question> retrieved = adminService.getQuestionById("q-test-create-01");
        assertTrue(retrieved.isPresent());
        assertEquals("What is the updated semantic purpose of the main tag?", retrieved.get().getText());
        assertEquals("medium", retrieved.get().getDifficulty());
        assertEquals(45, retrieved.get().getTimeLimitSeconds());
    }

    @Test
    @Order(6)
    @DisplayName("13. Question deletion removes item from XML and updates counts")
    void testQuestionDeletion() throws Exception {
        adminService.deleteQuestion("q-test-create-01");

        Optional<Question> retrieved = adminService.getQuestionById("q-test-create-01");
        assertTrue(retrieved.isEmpty(), "Deleted question must not be found");
        assertEquals(60, testDao.getQuestionCount(), "Count must return to 60");
    }

    @Test
    @Order(7)
    @DisplayName("18. Circular prerequisite rejection prevents dependency cycles")
    void testCircularPrerequisiteRejection() {
        // Direct cycle: topic A requires topic A
        Map<String, List<String>> selfCycle = Map.of(
                "topic-a", List.of("topic-a")
        );
        assertTrue(XmlQuestionDao.hasPrerequisiteCycle(selfCycle), "Self dependency must be detected as a cycle");

        // Indirect cycle: A -> B -> C -> A
        Map<String, List<String>> multiCycle = Map.of(
                "topic-a", List.of("topic-b"),
                "topic-b", List.of("topic-c"),
                "topic-c", List.of("topic-a")
        );
        assertTrue(XmlQuestionDao.hasPrerequisiteCycle(multiCycle), "Multi-node cycle must be detected");

        // Valid DAG: A -> [] , B -> [A], C -> [B]
        Map<String, List<String>> validDag = Map.of(
                "topic-a", Collections.emptyList(),
                "topic-b", List.of("topic-a"),
                "topic-c", List.of("topic-b")
        );
        assertFalse(XmlQuestionDao.hasPrerequisiteCycle(validDag), "Valid DAG must not be flagged as cyclic");

        // Attempting to make topic-daa require itself creates a cycle
        Topic invalidTopic = new Topic(
                "topic-daa",
                "Design and Analysis of Algorithms",
                "Description",
                "Cpu",
                "#475569",
                70,
                1,
                List.of("topic-daa") // Self-dependency cycle!
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            adminService.updateTopic(invalidTopic);
        });

        assertTrue(ex.getMessage().contains("Circular dependency detected"), "Exception must report circular dependency");
    }
}
