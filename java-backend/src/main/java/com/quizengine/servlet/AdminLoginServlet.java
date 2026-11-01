package com.quizengine.servlet;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quizengine.security.AdminAuthFilter;
import com.quizengine.security.JwtAuthFilter;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;

/**
 * Servlet handling Administrator login.
 * Integrates with the existing Node.js authentication system and validates
 * authentic HS256 JWT tokens. Strictly enforces role="admin".
 */
public class AdminLoginServlet extends HttpServlet {

    private final String jwtSecret;
    private final String nodeAuthUrl;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public AdminLoginServlet() {
        this(JwtAuthFilter.resolveJwtSecret(), resolveNodeAuthUrl());
    }

    public AdminLoginServlet(String jwtSecret, String nodeAuthUrl) {
        this.jwtSecret = jwtSecret;
        this.nodeAuthUrl = nodeAuthUrl;
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .build();
    }

    private static String resolveNodeAuthUrl() {
        String envUrl = System.getenv("NODE_AUTH_URL");
        if (envUrl != null && !envUrl.trim().isEmpty()) {
            return envUrl.trim();
        }
        String envApi = System.getenv("NODE_API_URL");
        if (envApi != null && !envApi.trim().isEmpty()) {
            return envApi.trim().replaceAll("/+$", "") + "/auth/login";
        }
        return "http://localhost:5001/api/auth/login";
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession(false);
        if (session != null && "admin".equals(session.getAttribute(AdminAuthFilter.SESSION_ADMIN_ROLE))) {
            resp.sendRedirect(req.getContextPath() + "/admin/dashboard");
            return;
        }

        if (req.getParameter("loggedOut") != null) {
            req.setAttribute("infoMessage", "You have been logged out successfully.");
        }

        req.getRequestDispatcher("/WEB-INF/jsp/admin/login.jsp").forward(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String authMethod = req.getParameter("authMethod"); // "credentials" or "token"
        String rawToken = null;
        String userEmail = null;

        try {
            if ("token".equalsIgnoreCase(authMethod)) {
                rawToken = req.getParameter("adminToken");
                if (rawToken == null || rawToken.trim().isEmpty()) {
                    throw new IllegalArgumentException("Admin JWT token is required");
                }
                rawToken = rawToken.trim();
            } else {
                // Email and Password Login Bridge via Node.js Auth Service
                String email = req.getParameter("email");
                String password = req.getParameter("password");

                if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
                    throw new IllegalArgumentException("Email and password are required");
                }

                rawToken = authenticateViaNodeBackend(email.trim(), password);
                userEmail = email.trim();
            }

            // Cryptographically verify token signature and claims
            Algorithm algorithm = Algorithm.HMAC256(jwtSecret);
            JWTVerifier verifier = JWT.require(algorithm).build();
            DecodedJWT decoded = verifier.verify(rawToken);

            String role = decoded.getClaim("role").asString();
            String userId = decoded.getClaim("id").asString();
            if (userId == null) userId = decoded.getSubject();

            // Strict role verification: Ordinary users are rejected
            if (!"admin".equalsIgnoreCase(role)) {
                throw new SecurityException("Access denied: Account does not have administrator privileges (role=" + role + ")");
            }

            // Authentication succeeded: Secure session management
            HttpSession session = req.getSession(true);
            try {
                req.changeSessionId(); // Prevent session fixation
            } catch (IllegalStateException ignored) {
            }

            String identifier = userEmail != null ? userEmail : (userId != null ? userId : "Admin");
            String csrfToken = UUID.randomUUID().toString();

            session.setAttribute(AdminAuthFilter.SESSION_ADMIN_ROLE, "admin");
            session.setAttribute(AdminAuthFilter.SESSION_ADMIN_USER, identifier);
            session.setAttribute(AdminAuthFilter.SESSION_CSRF_TOKEN, csrfToken);

            resp.sendRedirect(req.getContextPath() + "/admin/dashboard");

        } catch (Exception e) {
            req.setAttribute("errorMessage", e.getMessage() != null ? e.getMessage() : "Authentication failed");
            req.getRequestDispatcher("/WEB-INF/jsp/admin/login.jsp").forward(req, resp);
        }
    }

    private String authenticateViaNodeBackend(String email, String password) throws Exception {
        Map<String, String> creds = Map.of("email", email, "password", password);
        String jsonPayload = objectMapper.writeValueAsString(creds);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(nodeAuthUrl))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(5))
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode json = objectMapper.readTree(response.body());
                if (json.has("token")) {
                    return json.get("token").asText();
                }
                throw new SecurityException("Node authentication response did not contain a token");
            } else {
                JsonNode json = objectMapper.readTree(response.body());
                String msg = json.has("error") ? json.get("error").asText() : "Invalid credentials";
                throw new SecurityException(msg);
            }
        } catch (IOException e) {
            throw new IOException("Unable to reach Node.js authentication bridge at " + nodeAuthUrl + ". You may also authenticate using your Admin JWT Token directly.", e);
        }
    }
}
