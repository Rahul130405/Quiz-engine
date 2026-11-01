package com.quizengine.servlet;

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
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Servlet managing Topic display and safe metadata updates.
 * Prevents circular dependencies in prerequisite learning graphs.
 */
public class TopicManagementServlet extends HttpServlet {

    private final AdminQuestionService adminQuestionService;

    public TopicManagementServlet(AdminQuestionService adminQuestionService) {
        this.adminQuestionService = adminQuestionService;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        List<Topic> topics = adminQuestionService.getAllTopics();
        req.setAttribute("topics", topics);
        req.setAttribute("stats", adminQuestionService.getDashboardStats());
        req.setAttribute("successMessage", req.getParameter("success"));
        req.setAttribute("errorMessage", req.getParameter("error"));

        req.getRequestDispatcher("/WEB-INF/jsp/admin/topics.jsp").forward(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String id = req.getParameter("id");
        if (id == null || id.trim().isEmpty()) {
            resp.sendRedirect(req.getContextPath() + "/admin/topics?error=" + urlEncode("Topic ID is required"));
            return;
        }

        try {
            Optional<Topic> existingOpt = adminQuestionService.getTopicById(id.trim());
            if (existingOpt.isEmpty()) {
                throw new IllegalArgumentException("Topic not found: " + id);
            }

            Topic existing = existingOpt.get();
            String name = req.getParameter("name");
            String description = req.getParameter("description");
            String icon = req.getParameter("icon");
            String color = req.getParameter("color");

            int passingScore = existing.getPassingScore();
            try {
                String passStr = req.getParameter("passingScore");
                if (passStr != null) passingScore = Integer.parseInt(passStr.trim());
            } catch (NumberFormatException ignored) {}

            int order = existing.getOrder();
            try {
                String orderStr = req.getParameter("order");
                if (orderStr != null) order = Integer.parseInt(orderStr.trim());
            } catch (NumberFormatException ignored) {}

            List<String> prereqs = new ArrayList<>();
            String[] prereqArray = req.getParameterValues("prerequisites");
            if (prereqArray != null) {
                for (String p : prereqArray) {
                    if (p != null && !p.trim().isEmpty()) prereqs.add(p.trim());
                }
            } else {
                String prereqCsv = req.getParameter("prerequisitesCsv");
                if (prereqCsv != null && !prereqCsv.trim().isEmpty()) {
                    prereqs = Arrays.stream(prereqCsv.split(","))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .collect(Collectors.toList());
                }
            }

            // Reject self-prerequisite
            if (prereqs.contains(id.trim())) {
                throw new IllegalArgumentException("A topic cannot have itself as a prerequisite (" + id + ")");
            }

            Topic updated = new Topic(
                    id.trim(),
                    name != null ? name.trim() : existing.getName(),
                    description != null ? description.trim() : existing.getDescription(),
                    icon != null ? icon.trim() : existing.getIcon(),
                    color != null ? color.trim() : existing.getColor(),
                    passingScore,
                    order,
                    prereqs
            );

            adminQuestionService.updateTopic(updated);
            resp.sendRedirect(req.getContextPath() + "/admin/topics?success=" + urlEncode("Topic '" + updated.getName() + "' updated successfully"));

        } catch (Exception e) {
            resp.sendRedirect(req.getContextPath() + "/admin/topics?error=" + urlEncode("Update failed: " + e.getMessage()));
        }
    }

    private static String urlEncode(String str) {
        return URLEncoder.encode(str, StandardCharsets.UTF_8);
    }
}
