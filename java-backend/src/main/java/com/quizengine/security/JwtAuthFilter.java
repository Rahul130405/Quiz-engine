package com.quizengine.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Map;

/**
 * Jakarta Servlet Filter validating Node.js-issued HS256 JWT tokens.
 * Matches backend/middleware/auth.js token generation and verification logic.
 */
public class JwtAuthFilter implements Filter {

    public static final String USER_ID_ATTRIBUTE = "userId";
    public static final String USER_ROLE_ATTRIBUTE = "userRole";

    private final String jwtSecret;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public JwtAuthFilter() {
        this(resolveJwtSecret());
    }

    public JwtAuthFilter(String jwtSecret) {
        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            throw new IllegalStateException("CRITICAL SECURITY ERROR: JWT_SECRET is missing or empty. Authentication filter cannot start without a valid JWT secret.");
        }
        this.jwtSecret = jwtSecret.trim();
    }

    public static String resolveJwtSecret() {
        String envSecret = System.getenv("JWT_SECRET");
        if (envSecret != null && !envSecret.trim().isEmpty()) {
            return envSecret.trim();
        }
        String sysProp = System.getProperty("JWT_SECRET");
        if (sysProp != null && !sysProp.trim().isEmpty()) {
            return sysProp.trim();
        }
        throw new IllegalStateException("CRITICAL SECURITY CONFIGURATION ERROR: JWT_SECRET environment variable is missing. The server cannot start without an authoritative JWT secret.");
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // Allow CORS preflight requests
        if ("OPTIONS".equalsIgnoreCase(httpRequest.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        String authHeader = httpRequest.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            sendUnauthorized(httpResponse, "Not authorized — no token");
            return;
        }

        String token = authHeader.substring(7).trim();
        try {
            Algorithm algorithm = Algorithm.HMAC256(jwtSecret);
            JWTVerifier verifier = JWT.require(algorithm).build();
            DecodedJWT decodedJWT = verifier.verify(token);

            // Extract claims
            String userId = decodedJWT.getClaim("id").asString();
            String userRole = decodedJWT.getClaim("role").asString();

            if (userId == null || userId.isEmpty()) {
                // If claim was stored as non-string or subject
                userId = decodedJWT.getSubject();
            }

            if (userId == null) {
                sendUnauthorized(httpResponse, "Not authorized — invalid token payload");
                return;
            }

            httpRequest.setAttribute(USER_ID_ATTRIBUTE, userId);
            httpRequest.setAttribute(USER_ROLE_ATTRIBUTE, userRole != null ? userRole : "user");

            chain.doFilter(request, response);

        } catch (JWTVerificationException e) {
            sendUnauthorized(httpResponse, "Not authorized — invalid token");
        }
    }

    private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(), Map.of("error", message));
    }
}
