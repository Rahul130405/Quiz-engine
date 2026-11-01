package com.quizengine.dao;

import com.quizengine.model.Question;
import com.quizengine.model.Topic;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import javax.xml.transform.stream.StreamSource;
import javax.xml.validation.Schema;
import javax.xml.validation.SchemaFactory;
import javax.xml.validation.Validator;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/**
 * Data Access Object for XML Question and Topic repositories.
 * Uses DOM and XPath APIs with strict XXE protection, XSD validation,
 * thread-safe concurrency controls, and atomic file persistence.
 */
public class XmlQuestionDao {

    private final String questionsXmlPath;
    private final String topicsXmlPath;
    private final String schemaXsdPath;

    // Concurrency control to protect against simultaneous read/write race conditions
    private final ReentrantReadWriteLock rwLock = new ReentrantReadWriteLock(true);

    // In-memory thread-safe caches for fast lookup and concurrent access
    private final Map<String, Question> questionMap = new ConcurrentHashMap<>();
    private final Map<String, Topic> topicMap = new ConcurrentHashMap<>();

    private volatile Instant lastLoadedTime;
    private volatile boolean datastoreHealthy = false;

    public XmlQuestionDao() {
        File dataDir = resolveAuthoritativeDataDir();
        this.questionsXmlPath = new File(dataDir, "questions.xml").getAbsolutePath();
        this.topicsXmlPath = new File(dataDir, "topics.xml").getAbsolutePath();
        this.schemaXsdPath = new File(dataDir, "quiz-schema.xsd").getAbsolutePath();
        reload();
    }

    public XmlQuestionDao(String questionsXmlPath, String topicsXmlPath, String schemaXsdPath) {
        this.questionsXmlPath = questionsXmlPath;
        this.topicsXmlPath = topicsXmlPath;
        this.schemaXsdPath = schemaXsdPath;
        reload();
    }

    /**
     * Resolves the authoritative data directory from environment, system properties, or repository layout.
     */
    public static File resolveAuthoritativeDataDir() {
        String envDir = System.getenv("QUIZ_DATA_DIR");
        if (envDir != null && !envDir.trim().isEmpty()) {
            File dir = new File(envDir.trim());
            if (dir.exists() && dir.isDirectory()) return dir.getAbsoluteFile();
        }

        String sysProp = System.getProperty("quiz.data.dir");
        if (sysProp != null && !sysProp.trim().isEmpty()) {
            File dir = new File(sysProp.trim());
            if (dir.exists() && dir.isDirectory()) return dir.getAbsoluteFile();
        }

        // Relative path if running from java-backend directory
        File localData = new File("data");
        if (localData.exists() && new File(localData, "questions.xml").exists()) {
            return localData.getAbsoluteFile();
        }

        // Relative path if running from repository root
        File nestedData = new File("java-backend/data");
        if (nestedData.exists() && new File(nestedData, "questions.xml").exists()) {
            return nestedData.getAbsoluteFile();
        }

        return new File("D:/QUIZENGINE/quizengine/java-backend/data").getAbsoluteFile();
    }

    /**
     * Creates a secure, hardened DocumentBuilderFactory protected against XXE, SSRF, and entity expansion attacks.
     */
    public static DocumentBuilderFactory createSecureDocumentBuilderFactory() throws ParserConfigurationException {
        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        dbf.setNamespaceAware(true);
        dbf.setXIncludeAware(false);
        dbf.setExpandEntityReferences(false);

        // Standard OWASP XXE Protection Features
        dbf.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
        dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        dbf.setFeature("http://xml.org/sax/features/external-general-entities", false);
        dbf.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
        dbf.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);

        return dbf;
    }

    /**
     * Validates an XML Document against the quiz-schema.xsd.
     */
    public void validateXml(Document document) throws SAXException, IOException {
        SchemaFactory factory = SchemaFactory.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI);
        factory.setProperty(XMLConstants.ACCESS_EXTERNAL_DTD, "");
        factory.setProperty(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");

        SourceResolver resolver = resolveSource(schemaXsdPath);
        Schema schema;
        if (resolver.file != null && resolver.file.exists()) {
            schema = factory.newSchema(resolver.file);
        } else if (resolver.inputStream != null) {
            schema = factory.newSchema(new StreamSource(resolver.inputStream));
        } else {
            throw new IOException("Quiz schema XSD could not be located at: " + sanitizePathForLog(schemaXsdPath));
        }

        Validator validator = schema.newValidator();
        validator.setProperty(XMLConstants.ACCESS_EXTERNAL_DTD, "");
        validator.setProperty(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");
        validator.validate(new DOMSource(document));
    }

    /**
     * Parses an XML file into a DOM Document using the secure DocumentBuilder.
     */
    public Document parseXml(String path) throws ParserConfigurationException, SAXException, IOException {
        DocumentBuilderFactory dbf = createSecureDocumentBuilderFactory();
        DocumentBuilder db = dbf.newDocumentBuilder();

        SourceResolver resolver = resolveSource(path);
        if (resolver.file != null && resolver.file.exists()) {
            return db.parse(resolver.file);
        } else if (resolver.inputStream != null) {
            return db.parse(resolver.inputStream);
        } else {
            throw new IOException("XML document could not be located at: " + sanitizePathForLog(path));
        }
    }

    /**
     * Reloads and caches all topics and questions from XML, performing schema validation.
     */
    public void reload() {
        rwLock.writeLock().lock();
        try {
            questionMap.clear();
            topicMap.clear();

            // 1. Parse and Validate Topics XML
            Document topicsDoc = parseXml(topicsXmlPath);
            validateXml(topicsDoc);
            loadTopicsFromDocument(topicsDoc);

            // 2. Parse and Validate Questions XML
            Document questionsDoc = parseXml(questionsXmlPath);
            validateXml(questionsDoc);
            loadQuestionsFromDocument(questionsDoc);

            lastLoadedTime = Instant.now();
            datastoreHealthy = true;

        } catch (Exception e) {
            datastoreHealthy = false;
            throw new RuntimeException("Failed to initialize XML Question DAO: " + e.getMessage(), e);
        } finally {
            rwLock.writeLock().unlock();
        }
    }

    private void loadTopicsFromDocument(Document doc) {
        NodeList topicNodes = doc.getElementsByTagName("topic");
        for (int i = 0; i < topicNodes.getLength(); i++) {
            Element elem = (Element) topicNodes.item(i);
            String id = elem.getAttribute("id");
            String name = getChildText(elem, "name");
            String description = getChildText(elem, "description");
            String icon = getChildText(elem, "icon");
            String color = getChildText(elem, "color");
            int passingScore = parseInteger(getChildText(elem, "passingScore"), 60);
            int order = parseInteger(getChildText(elem, "order"), 0);

            List<String> prereqs = new ArrayList<>();
            NodeList prereqNodes = elem.getElementsByTagName("prerequisite");
            for (int p = 0; p < prereqNodes.getLength(); p++) {
                String prereq = prereqNodes.item(p).getTextContent().trim();
                if (!prereq.isEmpty()) prereqs.add(prereq);
            }

            Topic topic = new Topic(id, name, description, icon, color, passingScore, order, prereqs);
            topicMap.put(id, topic);
        }
    }

    private void loadQuestionsFromDocument(Document doc) {
        NodeList qNodes = doc.getElementsByTagName("question");
        for (int i = 0; i < qNodes.getLength(); i++) {
            Element elem = (Element) qNodes.item(i);
            String id = elem.getAttribute("id");
            String topicId = getChildText(elem, "topicId");
            String text = getChildText(elem, "text");
            int correctAnswer = parseInteger(getChildText(elem, "correctAnswer"), 0);
            String difficulty = getChildText(elem, "difficulty");
            String explanation = getChildText(elem, "explanation");
            int timeLimit = parseInteger(getChildText(elem, "timeLimitSeconds"), 25);

            List<String> options = new ArrayList<>();
            NodeList optNodes = elem.getElementsByTagName("option");
            for (int o = 0; o < optNodes.getLength(); o++) {
                options.add(optNodes.item(o).getTextContent());
            }

            Question q = new Question(id, topicId, text, options, correctAnswer, difficulty, explanation, timeLimit);
            questionMap.put(id, q);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Query Methods (Protected by Read Lock)
    // ─────────────────────────────────────────────────────────────

    public List<Topic> getAllTopics() {
        rwLock.readLock().lock();
        try {
            List<Topic> list = new ArrayList<>(topicMap.values());
            list.sort(Comparator.comparingInt(Topic::getOrder));
            return list;
        } finally {
            rwLock.readLock().unlock();
        }
    }

    public Optional<Topic> findTopicById(String topicId) {
        if (topicId == null) return Optional.empty();
        rwLock.readLock().lock();
        try {
            return Optional.ofNullable(topicMap.get(topicId));
        } finally {
            rwLock.readLock().unlock();
        }
    }

    public List<Question> getAllQuestions() {
        rwLock.readLock().lock();
        try {
            return new ArrayList<>(questionMap.values());
        } finally {
            rwLock.readLock().unlock();
        }
    }

    public Optional<Question> findQuestionById(String id) {
        if (id == null) return Optional.empty();
        rwLock.readLock().lock();
        try {
            return Optional.ofNullable(questionMap.get(id));
        } finally {
            rwLock.readLock().unlock();
        }
    }

    public List<Question> findQuestionsByTopic(String topicId) {
        if (topicId == null) return Collections.emptyList();
        rwLock.readLock().lock();
        try {
            List<Question> result = new ArrayList<>();
            for (Question q : questionMap.values()) {
                if (topicId.equalsIgnoreCase(q.getTopicId())) {
                    result.add(q);
                }
            }
            return result;
        } finally {
            rwLock.readLock().unlock();
        }
    }

    public List<Question> findQuestionsByTopicAndDifficulty(String topicId, String difficulty) {
        if (topicId == null) return Collections.emptyList();
        rwLock.readLock().lock();
        try {
            List<Question> result = new ArrayList<>();
            for (Question q : questionMap.values()) {
                boolean topicMatch = topicId.equalsIgnoreCase(q.getTopicId());
                boolean diffMatch = difficulty == null || difficulty.equalsIgnoreCase(q.getDifficulty());
                if (topicMatch && diffMatch) {
                    result.add(q);
                }
            }
            return result;
        } finally {
            rwLock.readLock().unlock();
        }
    }

    public int getQuestionCount() {
        return questionMap.size();
    }

    public int getTopicCount() {
        return topicMap.size();
    }

    public long getQuestionCountByDifficulty(String difficulty) {
        if (difficulty == null) return 0;
        rwLock.readLock().lock();
        try {
            return questionMap.values().stream()
                    .filter(q -> difficulty.equalsIgnoreCase(q.getDifficulty()))
                    .count();
        } finally {
            rwLock.readLock().unlock();
        }
    }

    public long getQuestionCountByTopic(String topicId) {
        if (topicId == null) return 0;
        rwLock.readLock().lock();
        try {
            return questionMap.values().stream()
                    .filter(q -> topicId.equalsIgnoreCase(q.getTopicId()))
                    .count();
        } finally {
            rwLock.readLock().unlock();
        }
    }

    /**
     * XPath-based search for questions matching a safe XPath expression.
     */
    public List<Question> queryQuestionsByXPath(String topicId, String difficulty) throws XPathExpressionException, SAXException, IOException, ParserConfigurationException {
        String safeTopic = (topicId != null) ? topicId.replaceAll("[^a-zA-Z0-9_-]", "") : "";
        String safeDiff = (difficulty != null) ? difficulty.replaceAll("[^a-zA-Z0-9_-]", "") : "";

        StringBuilder xpathExpr = new StringBuilder("/questions/question");
        List<String> conditions = new ArrayList<>();
        if (!safeTopic.isEmpty()) {
            conditions.add("topicId='" + safeTopic + "'");
        }
        if (!safeDiff.isEmpty()) {
            conditions.add("difficulty='" + safeDiff + "'");
        }
        if (!conditions.isEmpty()) {
            xpathExpr.append("[").append(String.join(" and ", conditions)).append("]");
        }

        Document doc = parseXml(questionsXmlPath);
        XPath xpath = XPathFactory.newInstance().newXPath();
        NodeList nodes = (NodeList) xpath.evaluate(xpathExpr.toString(), doc, XPathConstants.NODESET);

        List<Question> results = new ArrayList<>();
        for (int i = 0; i < nodes.getLength(); i++) {
            Element elem = (Element) nodes.item(i);
            String id = elem.getAttribute("id");
            Question q = questionMap.get(id);
            if (q != null) results.add(q);
        }
        return results;
    }

    public boolean isDatastoreHealthy() {
        return datastoreHealthy;
    }

    public Instant getLastLoadedTime() {
        return lastLoadedTime;
    }

    public String getQuestionsXmlPath() {
        return questionsXmlPath;
    }

    public String getTopicsXmlPath() {
        return topicsXmlPath;
    }

    // ─────────────────────────────────────────────────────────────
    // Write & Mutate Operations (Task 7, 8, 9, 10, 11 Safe Persistence)
    // ─────────────────────────────────────────────────────────────

    /**
     * Atomically adds a new question or edits an existing question.
     * Writes to a temporary file, validates against XSD, atomically moves into place,
     * and refreshes the in-memory cache.
     */
    public void saveQuestion(Question question, boolean isNew) throws Exception {
        if (question == null) throw new IllegalArgumentException("Question cannot be null");
        validateQuestionFields(question);

        rwLock.writeLock().lock();
        try {
            if (isNew && questionMap.containsKey(question.getId())) {
                throw new IllegalArgumentException("Question ID already exists: " + question.getId());
            }
            if (!isNew && !questionMap.containsKey(question.getId())) {
                throw new IllegalArgumentException("Question not found: " + question.getId());
            }

            Map<String, Question> updatedMap = new LinkedHashMap<>(questionMap);
            updatedMap.put(question.getId(), question);

            saveQuestionsSafely(new ArrayList<>(updatedMap.values()));

        } finally {
            rwLock.writeLock().unlock();
        }
    }

    /**
     * Atomically deletes a question by ID.
     */
    public void deleteQuestion(String questionId) throws Exception {
        if (questionId == null || questionId.trim().isEmpty()) {
            throw new IllegalArgumentException("Question ID cannot be empty");
        }

        rwLock.writeLock().lock();
        try {
            if (!questionMap.containsKey(questionId)) {
                throw new IllegalArgumentException("Question not found for deletion: " + questionId);
            }

            Map<String, Question> updatedMap = new LinkedHashMap<>(questionMap);
            updatedMap.remove(questionId);

            saveQuestionsSafely(new ArrayList<>(updatedMap.values()));

        } finally {
            rwLock.writeLock().unlock();
        }
    }

    /**
     * Atomically updates a topic's metadata and verifies circular dependency safety.
     */
    public void updateTopic(Topic updatedTopic) throws Exception {
        if (updatedTopic == null) throw new IllegalArgumentException("Topic cannot be null");
        if (!topicMap.containsKey(updatedTopic.getId())) {
            throw new IllegalArgumentException("Topic not found: " + updatedTopic.getId());
        }

        rwLock.writeLock().lock();
        try {
            Map<String, Topic> updatedMap = new LinkedHashMap<>(topicMap);
            updatedMap.put(updatedTopic.getId(), updatedTopic);

            // Cycle Detection on topic prerequisites
            Map<String, List<String>> dependencyGraph = new HashMap<>();
            for (Topic t : updatedMap.values()) {
                dependencyGraph.put(t.getId(), t.getPrerequisites() != null ? t.getPrerequisites() : Collections.emptyList());
            }

            if (hasPrerequisiteCycle(dependencyGraph)) {
                throw new IllegalArgumentException("Circular dependency detected in topic prerequisites for: " + updatedTopic.getId());
            }

            saveTopicsSafely(new ArrayList<>(updatedMap.values()));

        } finally {
            rwLock.writeLock().unlock();
        }
    }

    private void saveQuestionsSafely(List<Question> questionsList) throws Exception {
        File targetFile = new File(questionsXmlPath);
        File parentDir = targetFile.getParentFile();
        if (parentDir != null && !parentDir.exists()) {
            parentDir.mkdirs();
        }

        File tempFile = new File(parentDir, "questions.xml.tmp");
        Document doc = buildQuestionsDocument(questionsList);
        writeDocumentToFile(doc, tempFile);

        // Validate temporary file against XSD before replacing authoritative datastore
        try {
            Document parsedTemp = parseXml(tempFile.getAbsolutePath());
            validateXml(parsedTemp);
        } catch (Exception e) {
            tempFile.delete();
            throw new IllegalArgumentException("XML Schema (XSD) validation failed for questions: " + e.getMessage(), e);
        }

        // Atomically replace live file
        try {
            Files.move(tempFile.toPath(), targetFile.toPath(), StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
        } catch (AtomicMoveNotSupportedException e) {
            Files.move(tempFile.toPath(), targetFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
        }

        // Keep classpath dev copy synchronized if it exists on disk
        syncResourceCopyIfExists("questions.xml", targetFile);

        // Reload memory caches
        reload();
    }

    private void saveTopicsSafely(List<Topic> topicsList) throws Exception {
        File targetFile = new File(topicsXmlPath);
        File parentDir = targetFile.getParentFile();
        if (parentDir != null && !parentDir.exists()) {
            parentDir.mkdirs();
        }

        File tempFile = new File(parentDir, "topics.xml.tmp");
        Document doc = buildTopicsDocument(topicsList);
        writeDocumentToFile(doc, tempFile);

        try {
            Document parsedTemp = parseXml(tempFile.getAbsolutePath());
            validateXml(parsedTemp);
        } catch (Exception e) {
            tempFile.delete();
            throw new IllegalArgumentException("XML Schema (XSD) validation failed for topics: " + e.getMessage(), e);
        }

        try {
            Files.move(tempFile.toPath(), targetFile.toPath(), StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
        } catch (AtomicMoveNotSupportedException e) {
            Files.move(tempFile.toPath(), targetFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
        }

        syncResourceCopyIfExists("topics.xml", targetFile);
        reload();
    }

    private Document buildQuestionsDocument(List<Question> questions) throws ParserConfigurationException {
        DocumentBuilderFactory dbf = createSecureDocumentBuilderFactory();
        DocumentBuilder db = dbf.newDocumentBuilder();
        Document doc = db.newDocument();
        Element root = doc.createElement("questions");
        doc.appendChild(root);

        for (Question q : questions) {
            Element qElem = doc.createElement("question");
            qElem.setAttribute("id", q.getId());

            Element topicElem = doc.createElement("topicId");
            topicElem.setTextContent(q.getTopicId());
            qElem.appendChild(topicElem);

            Element textElem = doc.createElement("text");
            textElem.setTextContent(q.getText());
            qElem.appendChild(textElem);

            Element optsElem = doc.createElement("options");
            for (String opt : q.getOptions()) {
                Element optElem = doc.createElement("option");
                optElem.setTextContent(opt != null ? opt : "");
                optsElem.appendChild(optElem);
            }
            qElem.appendChild(optsElem);

            Element correctElem = doc.createElement("correctAnswer");
            correctElem.setTextContent(String.valueOf(q.getCorrectAnswer()));
            qElem.appendChild(correctElem);

            Element diffElem = doc.createElement("difficulty");
            diffElem.setTextContent(q.getDifficulty());
            qElem.appendChild(diffElem);

            Element expElem = doc.createElement("explanation");
            expElem.setTextContent(q.getExplanation() != null ? q.getExplanation() : "");
            qElem.appendChild(expElem);

            Element timeElem = doc.createElement("timeLimitSeconds");
            timeElem.setTextContent(String.valueOf(q.getTimeLimitSeconds() > 0 ? q.getTimeLimitSeconds() : 25));
            qElem.appendChild(timeElem);

            root.appendChild(qElem);
        }
        return doc;
    }

    private Document buildTopicsDocument(List<Topic> topics) throws ParserConfigurationException {
        DocumentBuilderFactory dbf = createSecureDocumentBuilderFactory();
        DocumentBuilder db = dbf.newDocumentBuilder();
        Document doc = db.newDocument();
        Element root = doc.createElement("topics");
        doc.appendChild(root);

        for (Topic t : topics) {
            Element tElem = doc.createElement("topic");
            tElem.setAttribute("id", t.getId());

            Element nameElem = doc.createElement("name");
            nameElem.setTextContent(t.getName());
            tElem.appendChild(nameElem);

            Element descElem = doc.createElement("description");
            descElem.setTextContent(t.getDescription());
            tElem.appendChild(descElem);

            Element iconElem = doc.createElement("icon");
            iconElem.setTextContent(t.getIcon());
            tElem.appendChild(iconElem);

            Element colorElem = doc.createElement("color");
            colorElem.setTextContent(t.getColor());
            tElem.appendChild(colorElem);

            Element passElem = doc.createElement("passingScore");
            passElem.setTextContent(String.valueOf(t.getPassingScore()));
            tElem.appendChild(passElem);

            Element orderElem = doc.createElement("order");
            orderElem.setTextContent(String.valueOf(t.getOrder()));
            tElem.appendChild(orderElem);

            if (t.getPrerequisites() != null && !t.getPrerequisites().isEmpty()) {
                Element prereqsElem = doc.createElement("prerequisites");
                for (String p : t.getPrerequisites()) {
                    Element pElem = doc.createElement("prerequisite");
                    pElem.setTextContent(p);
                    prereqsElem.appendChild(pElem);
                }
                tElem.appendChild(prereqsElem);
            }

            root.appendChild(tElem);
        }
        return doc;
    }

    private void writeDocumentToFile(Document doc, File file) throws TransformerException, IOException {
        TransformerFactory tf = TransformerFactory.newInstance();
        tf.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");
        tf.setAttribute(XMLConstants.ACCESS_EXTERNAL_STYLESHEET, "");

        Transformer transformer = tf.newTransformer();
        transformer.setOutputProperty(OutputKeys.INDENT, "yes");
        transformer.setOutputProperty("{http://xml.apache.org/xslt}indent-amount", "4");
        transformer.setOutputProperty(OutputKeys.ENCODING, "UTF-8");
        transformer.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "no");

        try (FileOutputStream fos = new FileOutputStream(file)) {
            transformer.transform(new DOMSource(doc), new StreamResult(fos));
        }
    }

    private void syncResourceCopyIfExists(String filename, File authoritativeFile) {
        try {
            File resCopy = new File("src/main/resources/data/" + filename);
            if (resCopy.exists()) {
                Files.copy(authoritativeFile.toPath(), resCopy.toPath(), StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (Exception ignored) {
        }
    }

    public static boolean hasPrerequisiteCycle(Map<String, List<String>> graph) {
        Set<String> visited = new HashSet<>();
        Set<String> recStack = new HashSet<>();

        for (String node : graph.keySet()) {
            if (isCyclicUtil(node, graph, visited, recStack)) {
                return true;
            }
        }
        return false;
    }

    private static boolean isCyclicUtil(String node, Map<String, List<String>> graph, Set<String> visited, Set<String> recStack) {
        if (recStack.contains(node)) return true;
        if (visited.contains(node)) return false;

        visited.add(node);
        recStack.add(node);

        List<String> neighbors = graph.getOrDefault(node, Collections.emptyList());
        for (String neighbor : neighbors) {
            if (isCyclicUtil(neighbor, graph, visited, recStack)) {
                return true;
            }
        }

        recStack.remove(node);
        return false;
    }

    private void validateQuestionFields(Question q) {
        if (q.getId() == null || q.getId().trim().isEmpty()) {
            throw new IllegalArgumentException("Question ID is required");
        }
        if (q.getTopicId() == null || q.getTopicId().trim().isEmpty() || !topicMap.containsKey(q.getTopicId())) {
            throw new IllegalArgumentException("Valid Topic ID is required. Known topics: " + topicMap.keySet());
        }
        if (q.getText() == null || q.getText().trim().length() < 5) {
            throw new IllegalArgumentException("Question text must be at least 5 characters long");
        }
        if (q.getOptions() == null || q.getOptions().size() != 4) {
            throw new IllegalArgumentException("Question must have exactly 4 options");
        }
        for (int i = 0; i < 4; i++) {
            if (q.getOptions().get(i) == null || q.getOptions().get(i).trim().isEmpty()) {
                throw new IllegalArgumentException("Option " + (char) ('A' + i) + " cannot be empty");
            }
        }
        if (q.getCorrectAnswer() < 0 || q.getCorrectAnswer() > 3) {
            throw new IllegalArgumentException("Correct answer index must be between 0 and 3");
        }
        String diff = q.getDifficulty();
        if (diff == null || (!diff.equalsIgnoreCase("easy") && !diff.equalsIgnoreCase("medium") && !diff.equalsIgnoreCase("hard"))) {
            throw new IllegalArgumentException("Difficulty must be 'easy', 'medium', or 'hard'");
        }
        if (q.getTimeLimitSeconds() <= 0 || q.getTimeLimitSeconds() > 600) {
            throw new IllegalArgumentException("Time limit must be positive and at most 600 seconds");
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Helper Methods
    // ─────────────────────────────────────────────────────────────

    private static String getChildText(Element parent, String tagName) {
        NodeList list = parent.getElementsByTagName(tagName);
        if (list.getLength() > 0 && list.item(0) != null) {
            return list.item(0).getTextContent().trim();
        }
        return "";
    }

    private static int parseInteger(String val, int defaultVal) {
        try {
            return Integer.parseInt(val);
        } catch (Exception e) {
            return defaultVal;
        }
    }

    private static String sanitizePathForLog(String path) {
        return path != null ? new File(path).getName() : "unknown";
    }

    private SourceResolver resolveSource(String path) {
        File file = new File(path);
        if (file.exists()) {
            return new SourceResolver(file, null);
        }

        File nested = new File("java-backend", path);
        if (nested.exists()) {
            return new SourceResolver(nested, null);
        }

        String resourcePath = path.startsWith("/") ? path : "/" + path;
        InputStream is = getClass().getResourceAsStream(resourcePath);
        if (is != null) {
            return new SourceResolver(null, is);
        }

        String cleanPath = resourcePath.replace("/src/main/resources", "");
        InputStream is2 = getClass().getResourceAsStream(cleanPath);
        if (is2 != null) {
            return new SourceResolver(null, is2);
        }

        return new SourceResolver(null, null);
    }

    private static class SourceResolver {
        final File file;
        final InputStream inputStream;

        SourceResolver(File file, InputStream inputStream) {
            this.file = file;
            this.inputStream = inputStream;
        }
    }
}
