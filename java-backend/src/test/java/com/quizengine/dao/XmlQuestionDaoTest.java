package com.quizengine.dao;

import com.quizengine.model.Question;
import com.quizengine.model.Topic;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.w3c.dom.Document;
import org.xml.sax.SAXException;
import org.xml.sax.SAXParseException;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class XmlQuestionDaoTest {

    private XmlQuestionDao dao;

    @BeforeEach
    void setUp() {
        dao = new XmlQuestionDao("data/questions.xml", "data/topics.xml", "data/quiz-schema.xsd");
    }

    @Test
    @DisplayName("1. XML parsing successfully loads all 60 questions and 3 topics")
    void testXmlParsing() {
        assertEquals(60, dao.getQuestionCount(), "Must load exactly 60 migrated questions");
        assertEquals(3, dao.getTopicCount(), "Must load exactly 3 topics");

        List<Topic> topics = dao.getAllTopics();
        assertEquals(3, topics.size());
        assertEquals("topic-html", topics.get(0).getId());
        assertEquals("topic-daa", topics.get(1).getId());
        assertEquals("topic-java", topics.get(2).getId());
    }

    @Test
    @DisplayName("2. XML XSD validation succeeds on valid questions and topics XML")
    void testXmlXsdValidation() throws Exception {
        Document qDoc = dao.parseXml("data/questions.xml");
        assertDoesNotThrow(() -> dao.validateXml(qDoc), "questions.xml must conform to quiz-schema.xsd");

        Document tDoc = dao.parseXml("data/topics.xml");
        assertDoesNotThrow(() -> dao.validateXml(tDoc), "topics.xml must conform to quiz-schema.xsd");
    }

    @Test
    @DisplayName("3. Invalid XML handling detects schema violations and malformed XML")
    void testInvalidXmlHandling() throws Exception {
        // Missing required 'topicId' and 'correctAnswer'
        String invalidXml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
                "<questions>\n" +
                "    <question id=\"invalid-1\">\n" +
                "        <text>Missing required fields</text>\n" +
                "    </question>\n" +
                "</questions>";

        DocumentBuilder db = XmlQuestionDao.createSecureDocumentBuilderFactory().newDocumentBuilder();
        Document doc = db.parse(new ByteArrayInputStream(invalidXml.getBytes(StandardCharsets.UTF_8)));

        assertThrows(SAXException.class, () -> dao.validateXml(doc),
                "Validator must reject XML with missing mandatory elements");

        // Malformed XML syntax
        String malformedXml = "<questions><question>unclosed</questions>";
        assertThrows(SAXParseException.class, () -> {
            db.parse(new ByteArrayInputStream(malformedXml.getBytes(StandardCharsets.UTF_8)));
        });
    }

    @Test
    @DisplayName("4. XXE protection disables DOCTYPE and external entity resolution")
    void testXxeProtection() throws Exception {
        // Attempt an XXE attack trying to load /etc/passwd or windows system file
        String xxePayload = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
                "<!DOCTYPE questions [\n" +
                "  <!ENTITY xxe SYSTEM \"file:///windows/win.ini\">\n" +
                "]>\n" +
                "<questions>\n" +
                "    <question id=\"q-xxe\">\n" +
                "        <topicId>&xxe;</topicId>\n" +
                "    </question>\n" +
                "</questions>";

        DocumentBuilderFactory dbf = XmlQuestionDao.createSecureDocumentBuilderFactory();
        DocumentBuilder db = dbf.newDocumentBuilder();

        // Must throw SAXParseException due to disallow-doctype-decl feature
        assertThrows(SAXException.class, () -> {
            db.parse(new ByteArrayInputStream(xxePayload.getBytes(StandardCharsets.UTF_8)));
        }, "Parser must reject external DOCTYPE declarations to prevent XXE");
    }

    @Test
    @DisplayName("5. Topic filtering accurately retrieves questions by topic ID")
    void testTopicFiltering() {
        List<Question> htmlQuestions = dao.findQuestionsByTopic("topic-html");
        assertEquals(20, htmlQuestions.size(), "Must have 20 questions for HTML");

        List<Question> daaQuestions = dao.findQuestionsByTopic("topic-daa");
        assertEquals(20, daaQuestions.size(), "Must have 20 questions for DAA");

        List<Question> javaQuestions = dao.findQuestionsByTopic("topic-java");
        assertEquals(20, javaQuestions.size(), "Must have 20 questions for Java");

        List<Question> unknown = dao.findQuestionsByTopic("unknown-topic");
        assertTrue(unknown.isEmpty(), "Unknown topic must return empty list");
    }

    @Test
    @DisplayName("6. Difficulty filtering correctly filters easy, medium, and hard questions")
    void testDifficultyFiltering() {
        List<Question> htmlEasy = dao.findQuestionsByTopicAndDifficulty("topic-html", "easy");
        assertFalse(htmlEasy.isEmpty(), "HTML easy questions must exist");
        assertTrue(htmlEasy.stream().allMatch(q -> "easy".equalsIgnoreCase(q.getDifficulty())));

        List<Question> htmlMedium = dao.findQuestionsByTopicAndDifficulty("topic-html", "medium");
        assertFalse(htmlMedium.isEmpty(), "HTML medium questions must exist");
        assertTrue(htmlMedium.stream().allMatch(q -> "medium".equalsIgnoreCase(q.getDifficulty())));

        List<Question> daaHard = dao.findQuestionsByTopicAndDifficulty("topic-daa", "hard");
        assertFalse(daaHard.isEmpty(), "DAA hard questions must exist");
        assertTrue(daaHard.stream().allMatch(q -> "hard".equalsIgnoreCase(q.getDifficulty())));
    }

    @Test
    @DisplayName("XPath queries safely execute and return matching question nodes")
    void testXPathQuery() throws Exception {
        List<Question> results = dao.queryQuestionsByXPath("topic-html", "easy");
        assertFalse(results.isEmpty());
        for (Question q : results) {
            assertEquals("topic-html", q.getTopicId());
            assertEquals("easy", q.getDifficulty());
        }
    }

    @Test
    @DisplayName("16. Concurrent XML update protection prevents race conditions under multithreaded load")
    void testConcurrentXmlUpdateProtection() throws Exception {
        File tempDir = java.nio.file.Files.createTempDirectory("quizengine-concurrency-").toFile();
        File qFile = new File(tempDir, "questions.xml");
        File tFile = new File(tempDir, "topics.xml");
        File xFile = new File(tempDir, "quiz-schema.xsd");

        java.nio.file.Files.copy(new File("data/questions.xml").toPath(), qFile.toPath());
        java.nio.file.Files.copy(new File("data/topics.xml").toPath(), tFile.toPath());
        java.nio.file.Files.copy(new File("data/quiz-schema.xsd").toPath(), xFile.toPath());

        XmlQuestionDao testDao = new XmlQuestionDao(qFile.getAbsolutePath(), tFile.getAbsolutePath(), xFile.getAbsolutePath());

        int threadCount = 4;
        java.util.concurrent.ExecutorService executor = java.util.concurrent.Executors.newFixedThreadPool(threadCount);
        java.util.concurrent.CountDownLatch latch = new java.util.concurrent.CountDownLatch(threadCount);
        java.util.concurrent.atomic.AtomicInteger successCount = new java.util.concurrent.atomic.AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            final int idx = i;
            executor.submit(() -> {
                try {
                    Question q = new Question(
                            "q-concurrent-" + idx,
                            "topic-html",
                            "Concurrent question statement " + idx + " verifying lock safety?",
                            List.of("Option A", "Option B", "Option C", "Option D"),
                            0,
                            "easy",
                            "Explanation " + idx,
                            25
                    );
                    testDao.saveQuestion(q, true);
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await(10, java.util.concurrent.TimeUnit.SECONDS);
        executor.shutdown();

        assertEquals(threadCount, successCount.get(), "All concurrent writes must safely succeed without corrupting XML");
        assertEquals(60 + threadCount, testDao.getQuestionCount(), "DAO must reflect all concurrently saved questions");

        // Verify the resulting file on disk is strictly valid according to XSD
        Document parsed = testDao.parseXml(qFile.getAbsolutePath());
        assertDoesNotThrow(() -> testDao.validateXml(parsed), "Resulting XML on disk must pass schema validation");

        // Clean up
        for (File f : tempDir.listFiles()) f.delete();
        tempDir.delete();
    }

    @Test
    @DisplayName("17. Repository reload after modification reflects updates synchronously")
    void testRepositoryReloadAfterModification() throws Exception {
        File tempDir = java.nio.file.Files.createTempDirectory("quizengine-reload-").toFile();
        File qFile = new File(tempDir, "questions.xml");
        File tFile = new File(tempDir, "topics.xml");
        File xFile = new File(tempDir, "quiz-schema.xsd");

        java.nio.file.Files.copy(new File("data/questions.xml").toPath(), qFile.toPath());
        java.nio.file.Files.copy(new File("data/topics.xml").toPath(), tFile.toPath());
        java.nio.file.Files.copy(new File("data/quiz-schema.xsd").toPath(), xFile.toPath());

        XmlQuestionDao testDao = new XmlQuestionDao(qFile.getAbsolutePath(), tFile.getAbsolutePath(), xFile.getAbsolutePath());
        assertEquals(60, testDao.getQuestionCount());

        Question newQ = new Question(
                "q-sync-reload-01",
                "topic-java",
                "What is the parent class of all classes in Java?",
                List.of("Object", "Class", "System", "Runtime"),
                0,
                "easy",
                "java.lang.Object is the root of the class hierarchy.",
                20
        );

        testDao.saveQuestion(newQ, true);

        // Immediate verification from cache
        Optional<Question> found = testDao.findQuestionById("q-sync-reload-01");
        assertTrue(found.isPresent(), "In-memory cache must reflect saved question immediately");
        assertEquals("java.lang.Object is the root of the class hierarchy.", found.get().getExplanation());

        // Clean up
        for (File f : tempDir.listFiles()) f.delete();
        tempDir.delete();
    }
}
