package com.quizengine.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

/**
 * Filter that protects all /admin/* routes, ensuring the user has an active
 * session with role="admin" and enforcing CSRF protection on state-changing requests.
 */
public class AdminAuthFilter implements Filter {

    public static final String SESSION_ADMIN_ROLE = "adminRole";
    public static final String SESSION_ADMIN_USER = "adminUser";
    public static final String SESSION_CSRF_TOKEN = "csrfToken";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;

        String uri = req.getRequestURI();
        String contextPath = req.getContextPath();
        String path = uri.substring(contextPath.length());

        // Whitelisted endpoints under /admin
        if (path.equals("/admin/login") || path.equals("/admin/logout") ||
            path.startsWith("/static/") || path.startsWith("/css/") || path.startsWith("/js/") ||
            path.startsWith("/admin/static/")) {
            chain.doFilter(request, response);
            return;
        }

        // Check active HTTP session
        HttpSession session = req.getSession(false);
        boolean isAuthenticatedAdmin = session != null &&
                "admin".equals(session.getAttribute(SESSION_ADMIN_ROLE));

        if (!isAuthenticatedAdmin) {
            if ("POST".equalsIgnoreCase(req.getMethod())) {
                resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                resp.setContentType("application/json");
                resp.getWriter().write("{\"error\":\"Unauthorized: Administrator session required\"}");
            } else {
                resp.sendRedirect(contextPath + "/admin/login");
            }
            return;
        }

        // Enforce CSRF protection on state-changing HTTP methods (POST, PUT, DELETE)
        if ("POST".equalsIgnoreCase(req.getMethod()) ||
            "PUT".equalsIgnoreCase(req.getMethod()) ||
            "DELETE".equalsIgnoreCase(req.getMethod())) {

            String sessionCsrf = (String) session.getAttribute(SESSION_CSRF_TOKEN);
            String requestCsrf = req.getParameter("csrfToken");

            boolean isValidCsrf = requestCsrf != null && sessionCsrf != null &&
                    java.security.MessageDigest.isEqual(
                            sessionCsrf.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                            requestCsrf.getBytes(java.nio.charset.StandardCharsets.UTF_8)
                    );

            if (!isValidCsrf) {
                resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
                req.setAttribute("errorMessage", "CSRF token validation failed. State-changing requests must provide a valid CSRF token.");
                req.getRequestDispatcher("/WEB-INF/jsp/admin/error.jsp").forward(req, resp);
                return;
            }
        }

        chain.doFilter(request, response);
    }
}
