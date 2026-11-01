package com.quizengine.servlet;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quizengine.model.QuizAnswer;
import com.quizengine.model.QuizResult;
import com.quizengine.security.JwtAuthFilter;
import com.quizengine.service.QuizEvaluationService;
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
 * QuizEvaluationServlet
 * Endpoint: POST /api/java/quiz/evaluate
 *
 * Receives submitted answers, validates them, grades them server-side
 * using the secure XML question repository, and securely persists the
 * verified result to MongoDB via Node.js server-to-server integration.
 */
@WebServlet(name = "QuizEvaluationServlet", urlPatterns = {"/api/java/quiz/evaluate"})
public class QuizEvaluationServlet extends HttpServlet {

    private final QuizEvaluationService evaluationService;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public QuizEvaluationServlet() {
        this(new QuizEvaluationService(), new ObjectMapper());
    }

    public QuizEvaluationServlet(QuizEvaluationService evaluationService, ObjectMapper objectMapper) {
        this.evaluationService = evaluationService;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .build();
    }

    public static String resolveNodeApiUrl() {
        String envUrl = System.getenv("NODE_API_URL");
        if (envUrl != null && !envUrl.trim().isEmpty()) {
            return envUrl.trim();
        }
        String authUrl = System.getenv("NODE_AUTH_URL");
        if (authUrl != null && !authUrl.trim().isEmpty()) {
            return authUrl.replace("/auth/login", "");
        }
        return "http://localhost:5001/api";
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        Map<String, Object> body;
        try {
            body = objectMapper.readValue(req.getInputStream(), new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            objectMapper.writeValue(resp.getWriter(), Map.of("error", "Invalid JSON request payload"));
            return;
        }

        if (body == null || !body.containsKey("topicId") || !body.containsKey("answers")) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            objectMapper.writeValue(resp.getWriter(), Map.of("error", "'topicId' and 'answers' array are required"));
            return;
        }

        String topicId = String.valueOf(body.get("topicId"));
        Object answersObj = body.get("answers");

        int timeTakenSeconds = 0;
        if (body.containsKey("timeTakenSeconds")) {
            try {
                timeTakenSeconds = Integer.parseInt(String.valueOf(body.get("timeTakenSeconds")));
            } catch (NumberFormatException ignored) {}
        }

        String clientSubmissionId = body.containsKey("submissionId") ? String.valueOf(body.get("submissionId")) : null;

        List<QuizAnswer> answers;
        try {
            answers = objectMapper.convertValue(answersObj, new TypeReference<List<QuizAnswer>>() {});
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            objectMapper.writeValue(resp.getWriter(), Map.of("error", "Malformed 'answers' list format"));
            return;
        }

        if (answers == null || answers.isEmpty()) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            objectMapper.writeValue(resp.getWriter(), Map.of("error", "Submitted 'answers' list cannot be empty"));
            return;
        }

        try {
            QuizResult result = evaluationService.evaluate(topicId, answers);

            // Task 5: Server-to-Server Result Persistence Bridge into MongoDB
            String authHeader = req.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String userId = (String) req.getAttribute(JwtAuthFilter.USER_ID_ATTRIBUTE);
                persistAttemptToMongo(result, timeTakenSeconds, clientSubmissionId, authHeader, userId);
            }

            resp.setStatus(HttpServletResponse.SC_OK);
            objectMapper.writeValue(resp.getWriter(), result);
        } catch (IllegalArgumentException e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            objectMapper.writeValue(resp.getWriter(), Map.of("error", e.getMessage()));
        } catch (IOException e) {
            resp.setStatus(HttpServletResponse.SC_BAD_GATEWAY);
            objectMapper.writeValue(resp.getWriter(), Map.of("error", "Persistence failed: " + e.getMessage()));
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            objectMapper.writeValue(resp.getWriter(), Map.of("error", "Evaluation failed: " + e.getMessage()));
        }
    }

    public static String resolveInternalServiceSecret() {
        String internalSecret = System.getenv("INTERNAL_SERVICE_SECRET");
        if (internalSecret != null && !internalSecret.trim().isEmpty()) {
            return internalSecret.trim();
        }
        return JwtAuthFilter.resolveJwtSecret();
    }

    private void persistAttemptToMongo(QuizResult result, int timeTakenSeconds, String clientSubmissionId, String bearerToken, String userId) throws Exception {
        String nodeEndpoint = resolveNodeApiUrl() + "/quiz/record-attempt";
        String submissionId = (clientSubmissionId != null && !clientSubmissionId.trim().isEmpty())
                ? clientSubmissionId.trim()
                : UUID.randomUUID().toString();
        long timestamp = System.currentTimeMillis();

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("topicId", result.getTopicId());
        payload.put("score", result.getScore());
        payload.put("maxPossibleScore", result.getMaxPossibleScore());
        payload.put("percentage", result.getPercentage());
        payload.put("passed", result.isPassed());
        payload.put("timeTakenSeconds", timeTakenSeconds);
        payload.put("streakBonus", result.getTotalStreakBonus());
        payload.put("submissionId", submissionId);
        payload.put("timestamp", timestamp);
        payload.put("answers", result.getHistory());

        String jsonPayload = objectMapper.writeValueAsString(payload);
        String secret = resolveInternalServiceSecret();

        // Construct canonical representation of answers
        StringBuilder ansSb = new StringBuilder();
        if (result.getHistory() != null) {
            for (int i = 0; i < result.getHistory().size(); i++) {
                if (i > 0) ansSb.append(";");
                QuizResult.AnswerDetail a = result.getHistory().get(i);
                ansSb.append(a.getQuestionId()).append(":")
                     .append(a.getSelectedOption()).append(":")
                     .append(a.isCorrect());
            }
        }
        String answersHash = sha256Hex(ansSb.toString());

        String formattedPct = String.format(java.util.Locale.ROOT, "%.2f", result.getPercentage());
        String effectiveUserId = userId != null ? userId : "";

        // Canonical payload string covering: submissionId, userId, topicId, score, percentage, passed, timestamp, answersHash
        String canonicalString = submissionId + "|" + effectiveUserId + "|" + result.getTopicId() + "|"
                + result.getScore() + "|" + formattedPct + "|" + result.isPassed() + "|"
                + timestamp + "|" + answersHash;

        String internalHmac = calculateHmac(canonicalString, secret);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(nodeEndpoint))
                .header("Content-Type", "application/json")
                .header("Authorization", bearerToken)
                .header("X-Internal-Service", internalHmac)
                .header("X-Internal-Timestamp", String.valueOf(timestamp))
                .timeout(Duration.ofSeconds(4))
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 200 || response.statusCode() == 201) {
            JsonNode resJson = objectMapper.readTree(response.body());
            if (resJson.has("attemptId")) {
                result.setAttemptId(resJson.get("attemptId").asText());
            }
            if (resJson.has("newTotalScore")) {
                result.setNewTotalScore(resJson.get("newTotalScore").asInt());
            }
            if (resJson.has("isNewBest")) {
                result.setNewBest(resJson.get("isNewBest").asBoolean());
            }
        } else {
            throw new IOException("Authoritative persistence bridge failed (status=" + response.statusCode() + "): " + response.body());
        }
    }

    private static String sha256Hex(String data) {
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(data.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 computation failed", e);
        }
    }

    private static String calculateHmac(String data, String key) {
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            javax.crypto.spec.SecretKeySpec secretKey = new javax.crypto.spec.SecretKeySpec(
                    key.getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] hmac = mac.doFinal(data.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hmac) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("HMAC computation failed", e);
        }
    }
}
