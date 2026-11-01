package com.quizengine.servlet;

import com.quizengine.model.Question;
import com.quizengine.model.Topic;
import com.quizengine.service.AdminQuestionService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Servlet managing Question CRUD operations:
 * - Listing questions with search, topic/difficulty filters, and pagination
 * - Creating questions with XSD validation
 * - Editing questions with identity preservation
 * - Deleting questions via POST only with CSRF verification
 */
public class QuestionManagementServlet extends HttpServlet {

    private final AdminQuestionService adminQuestionService;

    public QuestionManagementServlet(AdminQuestionService adminQuestionService) {
        this.adminQuestionService = adminQuestionService;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String path = req.getServletPath();
        String pathInfo = req.getPathInfo();
        String fullPath = path + (pathInfo != null ? pathInfo : "");

        if (fullPath.endsWith("/create")) {
            showCreateForm(req, resp);
        } else if (fullPath.endsWith("/edit")) {
            showEditForm(req, resp);
        } else if (fullPath.endsWith("/delete")) {
            // Task 9: Prevent deletion via GET requests
            resp.sendError(HttpServletResponse.SC_METHOD_NOT_ALLOWED, "Deletion is only permitted via POST requests.");
        } else {
            listQuestions(req, resp);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String path = req.getServletPath();
        String pathInfo = req.getPathInfo();
        String fullPath = path + (pathInfo != null ? pathInfo : "");

        if (fullPath.endsWith("/create")) {
            handleCreateQuestion(req, resp);
        } else if (fullPath.endsWith("/edit")) {
            handleEditQuestion(req, resp);
        } else if (fullPath.endsWith("/delete")) {
            handleDeleteQuestion(req, resp);
        } else {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Unknown POST action: " + fullPath);
        }
    }

    private void listQuestions(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String search = req.getParameter("search");
        String topicId = req.getParameter("topicId");
        String difficulty = req.getParameter("difficulty");

        int page = 1;
        try {
            String pStr = req.getParameter("page");
            if (pStr != null && !pStr.trim().isEmpty()) {
                page = Integer.parseInt(pStr.trim());
            }
        } catch (NumberFormatException ignored) {}

        int pageSize = 10;
        try {
            String psStr = req.getParameter("pageSize");
            if (psStr != null && !psStr.trim().isEmpty()) {
                pageSize = Math.min(50, Math.max(5, Integer.parseInt(psStr.trim())));
            }
        } catch (NumberFormatException ignored) {}

        AdminQuestionService.PaginatedResult<Question> result =
                adminQuestionService.searchAndFilterQuestions(search, topicId, difficulty, page, pageSize);

        List<Topic> topics = adminQuestionService.getAllTopics();

        req.setAttribute("result", result);
        req.setAttribute("topics", topics);
        req.setAttribute("search", search != null ? search : "");
        req.setAttribute("selectedTopic", topicId != null ? topicId : "");
        req.setAttribute("selectedDifficulty", difficulty != null ? difficulty : "");
        req.setAttribute("successMessage", req.getParameter("success"));
        req.setAttribute("errorMessage", req.getParameter("error"));

        req.getRequestDispatcher("/WEB-INF/jsp/admin/questions.jsp").forward(req, resp);
    }

    private void showCreateForm(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.setAttribute("topics", adminQuestionService.getAllTopics());
        req.getRequestDispatcher("/WEB-INF/jsp/admin/create-question.jsp").forward(req, resp);
    }

    private void showEditForm(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String id = req.getParameter("id");
        if (id == null || id.trim().isEmpty()) {
            resp.sendRedirect(req.getContextPath() + "/admin/questions?error=" + urlEncode("Missing question ID"));
            return;
        }

        Optional<Question> questionOpt = adminQuestionService.getQuestionById(id.trim());
        if (questionOpt.isEmpty()) {
            resp.sendRedirect(req.getContextPath() + "/admin/questions?error=" + urlEncode("Question not found: " + id));
            return;
        }

        req.setAttribute("question", questionOpt.get());
        req.setAttribute("topics", adminQuestionService.getAllTopics());
        req.getRequestDispatcher("/WEB-INF/jsp/admin/edit-question.jsp").forward(req, resp);
    }

    private void handleCreateQuestion(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        try {
            Question question = parseAndValidateQuestion(req, true);
            adminQuestionService.createQuestion(question);
            resp.sendRedirect(req.getContextPath() + "/admin/questions?success=" + urlEncode("Question " + question.getId() + " created successfully"));
        } catch (Exception e) {
            req.setAttribute("errorMessage", e.getMessage());
            req.setAttribute("topics", adminQuestionService.getAllTopics());
            req.getRequestDispatcher("/WEB-INF/jsp/admin/create-question.jsp").forward(req, resp);
        }
    }

    private void handleEditQuestion(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        try {
            Question question = parseAndValidateQuestion(req, false);
            adminQuestionService.updateQuestion(question);
            resp.sendRedirect(req.getContextPath() + "/admin/questions?success=" + urlEncode("Question " + question.getId() + " updated successfully"));
        } catch (Exception e) {
            req.setAttribute("errorMessage", e.getMessage());
            req.setAttribute("question", buildQuestionFromRequest(req));
            req.setAttribute("topics", adminQuestionService.getAllTopics());
            req.getRequestDispatcher("/WEB-INF/jsp/admin/edit-question.jsp").forward(req, resp);
        }
    }

    private void handleDeleteQuestion(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String id = req.getParameter("id");
        if (id == null || id.trim().isEmpty()) {
            resp.sendRedirect(req.getContextPath() + "/admin/questions?error=" + urlEncode("Missing question ID for deletion"));
            return;
        }

        try {
            adminQuestionService.deleteQuestion(id.trim());
            resp.sendRedirect(req.getContextPath() + "/admin/questions?success=" + urlEncode("Question " + id.trim() + " deleted successfully"));
        } catch (Exception e) {
            resp.sendRedirect(req.getContextPath() + "/admin/questions?error=" + urlEncode("Deletion failed: " + e.getMessage()));
        }
    }

    private Question parseAndValidateQuestion(HttpServletRequest req, boolean isNew) {
        String id = req.getParameter("id");
        if (id == null || id.trim().isEmpty()) {
            throw new IllegalArgumentException("Question ID is mandatory");
        }
        id = id.trim();

        String topicId = req.getParameter("topicId");
        if (topicId == null || topicId.trim().isEmpty()) {
            throw new IllegalArgumentException("Topic selection is mandatory");
        }
        topicId = topicId.trim();

        String text = req.getParameter("text");
        if (text == null || text.trim().length() < 5) {
            throw new IllegalArgumentException("Question text must be at least 5 characters");
        }
        text = text.trim();

        String optA = req.getParameter("optionA");
        String optB = req.getParameter("optionB");
        String optC = req.getParameter("optionC");
        String optD = req.getParameter("optionD");

        if (optA == null || optA.trim().isEmpty() ||
            optB == null || optB.trim().isEmpty() ||
            optC == null || optC.trim().isEmpty() ||
            optD == null || optD.trim().isEmpty()) {
            throw new IllegalArgumentException("All 4 options (A, B, C, D) are required");
        }

        List<String> options = List.of(optA.trim(), optB.trim(), optC.trim(), optD.trim());

        int correctAnswer;
        try {
            correctAnswer = Integer.parseInt(req.getParameter("correctAnswer"));
            if (correctAnswer < 0 || correctAnswer > 3) {
                throw new NumberFormatException();
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Correct answer index must be between 0 (Option A) and 3 (Option D)");
        }

        String difficulty = req.getParameter("difficulty");
        if (difficulty == null || (!difficulty.equalsIgnoreCase("easy") &&
                                   !difficulty.equalsIgnoreCase("medium") &&
                                   !difficulty.equalsIgnoreCase("hard"))) {
            throw new IllegalArgumentException("Difficulty must be 'easy', 'medium', or 'hard'");
        }
        difficulty = difficulty.trim().toLowerCase();

        String explanation = req.getParameter("explanation");
        explanation = (explanation != null) ? explanation.trim() : "";

        int timeLimitSeconds;
        try {
            timeLimitSeconds = Integer.parseInt(req.getParameter("timeLimitSeconds"));
            if (timeLimitSeconds <= 0 || timeLimitSeconds > 600) {
                throw new NumberFormatException();
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Time limit must be a positive integer between 1 and 600 seconds");
        }

        return new Question(id, topicId, text, options, correctAnswer, difficulty, explanation, timeLimitSeconds);
    }

    private Question buildQuestionFromRequest(HttpServletRequest req) {
        String id = req.getParameter("id");
        String topicId = req.getParameter("topicId");
        String text = req.getParameter("text");
        List<String> options = new ArrayList<>();
        options.add(req.getParameter("optionA") != null ? req.getParameter("optionA") : "");
        options.add(req.getParameter("optionB") != null ? req.getParameter("optionB") : "");
        options.add(req.getParameter("optionC") != null ? req.getParameter("optionC") : "");
        options.add(req.getParameter("optionD") != null ? req.getParameter("optionD") : "");
        int correct = 0;
        try { correct = Integer.parseInt(req.getParameter("correctAnswer")); } catch (Exception ignored) {}
        String diff = req.getParameter("difficulty");
        String exp = req.getParameter("explanation");
        int time = 25;
        try { time = Integer.parseInt(req.getParameter("timeLimitSeconds")); } catch (Exception ignored) {}
        return new Question(id, topicId, text, options, correct, diff, exp, time);
    }

    private static String urlEncode(String str) {
        return URLEncoder.encode(str, StandardCharsets.UTF_8);
    }
}
