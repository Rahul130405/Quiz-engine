package com.quizengine.servlet;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quizengine.model.Topic;
import com.quizengine.service.XmlQuestionService;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

/**
 * TopicServlet
 * Endpoint: GET /api/java/topics
 *
 * Returns curriculum topics and prerequisite graphs from topics.xml.
 * Decorates topics with user-specific unlock status, completed state, and SVG canvas positions.
 */
@WebServlet(name = "TopicServlet", urlPatterns = {"/api/java/topics"})
public class TopicServlet extends HttpServlet {

    private final XmlQuestionService questionService;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public TopicServlet() {
        this(new XmlQuestionService(), new ObjectMapper());
    }

    public TopicServlet(XmlQuestionService questionService, ObjectMapper objectMapper) {
        this.questionService = questionService;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(2))
                .build();
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        List<Topic> topics = questionService.getTopics();
        Map<String, JsonNode> userProgress = fetchUserProgress(req.getHeader("Authorization"));

        // Decorate topics with dynamic unlocked and completed status
        for (Topic t : topics) {
            boolean hasPrereqs = t.getPrerequisites() != null && !t.getPrerequisites().isEmpty();
            if (!hasPrereqs) {
                t.setUnlocked(true);
            } else {
                boolean allPrereqsMet = true;
                for (String prereqId : t.getPrerequisites()) {
                    boolean met = false;
                    if (userProgress.containsKey(prereqId)) {
                        JsonNode pNode = userProgress.get(prereqId);
                        if (pNode.has("completed") && pNode.get("completed").asBoolean()) {
                            met = true;
                        }
                    }
                    if (!met) {
                        allPrereqsMet = false;
                        break;
                    }
                }
                t.setUnlocked(allPrereqsMet);
            }

            // Check completion and best score for this topic
            if (userProgress.containsKey(t.getId())) {
                JsonNode pNode = userProgress.get(t.getId());
                if (pNode.has("completed")) t.setCompleted(pNode.get("completed").asBoolean());
                if (pNode.has("bestScore")) t.setBestScore(pNode.get("bestScore").asInt());
            }
        }

        resp.setStatus(HttpServletResponse.SC_OK);
        objectMapper.writeValue(resp.getWriter(), Map.of("topics", topics));
    }

    private Map<String, JsonNode> fetchUserProgress(String authHeader) {
        Map<String, JsonNode> progressMap = new HashMap<>();
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return progressMap;
        }

        try {
            String nodeEndpoint = QuizEvaluationServlet.resolveNodeApiUrl() + "/auth/me";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(nodeEndpoint))
                    .header("Authorization", authHeader)
                    .timeout(Duration.ofSeconds(2))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode json = objectMapper.readTree(response.body());
                if (json.has("user") && json.get("user").has("progress")) {
                    JsonNode pNode = json.get("user").get("progress");
                    Iterator<String> fieldNames = pNode.fieldNames();
                    while (fieldNames.hasNext()) {
                        String field = fieldNames.next();
                        progressMap.put(field, pNode.get(field));
                    }
                }
            }
        } catch (Exception ignored) {}
        return progressMap;
    }
}
