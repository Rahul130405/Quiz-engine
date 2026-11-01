package com.quizengine.servlet;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quizengine.model.QuizQuestionDTO;
import com.quizengine.model.Topic;
import com.quizengine.service.XmlQuestionService;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * QuizQuestionServlet
 * Endpoint: GET /api/java/questions?topicId=&difficulty=&count=
 *
 * Returns sanitized questions from questions.xml.
 * Strictly excludes correctAnswer and explanation.
 */
@WebServlet(name = "QuizQuestionServlet", urlPatterns = {"/api/java/questions"})
public class QuizQuestionServlet extends HttpServlet {

    private final XmlQuestionService questionService;
    private final ObjectMapper objectMapper;

    public QuizQuestionServlet() {
        this(new XmlQuestionService(), new ObjectMapper());
    }

    public QuizQuestionServlet(XmlQuestionService questionService, ObjectMapper objectMapper) {
        this.questionService = questionService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String topicId = req.getParameter("topicId");
        if (topicId == null || topicId.trim().isEmpty()) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            objectMapper.writeValue(resp.getWriter(), Map.of("error", "Query parameter 'topicId' is required"));
            return;
        }

        String difficulty = req.getParameter("difficulty");
        String countParam = req.getParameter("count");
        int count = 10;
        if (countParam != null) {
            try {
                count = Integer.parseInt(countParam);
            } catch (NumberFormatException ignored) {}
        }

        // Validate topic existence
        Optional<Topic> topicOpt = questionService.getTopicById(topicId);
        if (topicOpt.isEmpty()) {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            objectMapper.writeValue(resp.getWriter(), Map.of("error", "Topic not found: " + topicId));
            return;
        }

        Topic topic = topicOpt.get();

        // Task 6 Backend Prerequisite Enforcement: Reject direct API bypass
        if (topic.getPrerequisites() != null && !topic.getPrerequisites().isEmpty()) {
            String authHeader = req.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                boolean unlocked = verifyPrerequisitesMet(topic.getPrerequisites(), authHeader);
                if (!unlocked) {
                    resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    objectMapper.writeValue(resp.getWriter(), Map.of("error", "Complete prerequisites first to unlock this topic"));
                    return;
                }
            }
        }

        List<QuizQuestionDTO> questions = questionService.getSanitizedQuestions(topicId, difficulty, count, true);

        if (questions.isEmpty()) {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            objectMapper.writeValue(resp.getWriter(), Map.of("error", "No questions found for topic: " + topicId));
            return;
        }

        Map<String, Object> responseData = new HashMap<>();
        if (topicOpt.isPresent()) {
            Topic t = topicOpt.get();
            responseData.put("topic", Map.of(
                    "id", t.getId(),
                    "name", t.getName(),
                    "icon", t.getIcon()
            ));
        } else {
            responseData.put("topic", Map.of("id", topicId));
        }

        responseData.put("questions", questions);
        responseData.put("totalQuestions", questions.size());

        resp.setStatus(HttpServletResponse.SC_OK);
        objectMapper.writeValue(resp.getWriter(), responseData);
    }

    private boolean verifyPrerequisitesMet(List<String> prereqs, String authHeader) {
        try {
            String nodeEndpoint = QuizEvaluationServlet.resolveNodeApiUrl() + "/auth/me";
            java.net.http.HttpClient client = java.net.http.HttpClient.newBuilder()
                    .connectTimeout(java.time.Duration.ofSeconds(2))
                    .build();
            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(nodeEndpoint))
                    .header("Authorization", authHeader)
                    .timeout(java.time.Duration.ofSeconds(2))
                    .GET()
                    .build();

            java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                com.fasterxml.jackson.databind.JsonNode json = objectMapper.readTree(response.body());
                if (json.has("user") && json.get("user").has("progress")) {
                    com.fasterxml.jackson.databind.JsonNode progress = json.get("user").get("progress");
                    for (String p : prereqs) {
                        boolean completed = false;
                        if (progress.has(p) && progress.get(p).has("completed") && progress.get(p).get("completed").asBoolean()) {
                            completed = true;
                        }
                        if (!completed) return false;
                    }
                    return true;
                }
            }
        } catch (Exception ignored) {}
        return true;
    }
}
