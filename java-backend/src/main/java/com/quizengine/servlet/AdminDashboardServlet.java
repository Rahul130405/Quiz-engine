package com.quizengine.servlet;

import com.quizengine.service.AdminQuestionService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Map;

/**
 * Servlet serving the Administrator Dashboard.
 * Populates real metrics, question counts, and health status directly from the authoritative XML store.
 */
public class AdminDashboardServlet extends HttpServlet {

    private final AdminQuestionService adminQuestionService;

    public AdminDashboardServlet(AdminQuestionService adminQuestionService) {
        this.adminQuestionService = adminQuestionService;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        Map<String, Object> stats = adminQuestionService.getDashboardStats();
        req.setAttribute("stats", stats);
        req.getRequestDispatcher("/WEB-INF/jsp/admin/dashboard.jsp").forward(req, resp);
    }
}
