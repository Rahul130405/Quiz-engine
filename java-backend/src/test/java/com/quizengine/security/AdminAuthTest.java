package com.quizengine.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Date;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminAuthTest {

    private final String secret = "test_shared_jwt_secret_key_12345";
    private Algorithm algorithm;
    private JWTVerifier verifier;
    private AdminAuthFilter authFilter;

    @BeforeEach
    void setUp() {
        algorithm = Algorithm.HMAC256(secret);
        verifier = JWT.require(algorithm).build();
        authFilter = new AdminAuthFilter();
    }

    @Test
    @DisplayName("2. Admin authentication accepts valid admin role JWT")
    void testValidAdminRoleToken() {
        String adminToken = JWT.create()
                .withClaim("id", "admin_01")
                .withClaim("role", "admin")
                .withExpiresAt(new Date(System.currentTimeMillis() + 3600000))
                .sign(algorithm);

        DecodedJWT decoded = assertDoesNotThrow(() -> verifier.verify(adminToken));
        assertEquals("admin", decoded.getClaim("role").asString());
        assertEquals("admin_01", decoded.getClaim("id").asString());
    }

    @Test
    @DisplayName("3. Invalid JWT rejection rejects tampered and expired tokens")
    void testInvalidJwtRejection() {
        // Tampered signature with wrong secret
        String tamperedToken = JWT.create()
                .withClaim("id", "admin_01")
                .withClaim("role", "admin")
                .withExpiresAt(new Date(System.currentTimeMillis() + 3600000))
                .sign(Algorithm.HMAC256("attacker_key"));

        assertThrows(JWTVerificationException.class, () -> verifier.verify(tamperedToken));

        // Expired token
        String expiredToken = JWT.create()
                .withClaim("id", "admin_01")
                .withClaim("role", "admin")
                .withExpiresAt(new Date(System.currentTimeMillis() - 10000))
                .sign(algorithm);

        assertThrows(JWTVerificationException.class, () -> verifier.verify(expiredToken));
    }

    @Test
    @DisplayName("4. Non-admin rejection rejects regular users (role=user)")
    void testNonAdminRoleRejection() {
        String userToken = JWT.create()
                .withClaim("id", "student_01")
                .withClaim("role", "user")
                .withExpiresAt(new Date(System.currentTimeMillis() + 3600000))
                .sign(algorithm);

        DecodedJWT decoded = verifier.verify(userToken);
        String role = decoded.getClaim("role").asString();

        assertNotEquals("admin", role, "Regular user must not have admin role");
        assertTrue(!"admin".equalsIgnoreCase(role), "Authorization check must strictly reject role != admin");
    }

    @Test
    @DisplayName("5. Session handling enforces active admin session on protected routes")
    void testSessionHandlingFilter() throws ServletException, IOException {
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);
        HttpSession session = mock(HttpSession.class);

        when(request.getRequestURI()).thenReturn("/admin/dashboard");
        when(request.getContextPath()).thenReturn("");
        when(request.getMethod()).thenReturn("GET");

        // Unauthenticated request (no session)
        when(request.getSession(false)).thenReturn(null);
        authFilter.doFilter(request, response, chain);
        verify(response).sendRedirect("/admin/login");
        verify(chain, never()).doFilter(request, response);

        // Authenticated admin session
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute(AdminAuthFilter.SESSION_ADMIN_ROLE)).thenReturn("admin");
        authFilter.doFilter(request, response, chain);
        verify(chain).doFilter(request, response);
    }

    @Test
    @DisplayName("6. CSRF validation blocks state-changing requests without valid CSRF token")
    void testCsrfValidation() throws ServletException, IOException {
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);
        HttpSession session = mock(HttpSession.class);
        jakarta.servlet.RequestDispatcher dispatcher = mock(jakarta.servlet.RequestDispatcher.class);

        when(request.getRequestURI()).thenReturn("/admin/questions/delete");
        when(request.getContextPath()).thenReturn("");
        when(request.getMethod()).thenReturn("POST");
        when(request.getRequestDispatcher(anyString())).thenReturn(dispatcher);

        String correctCsrf = UUID.randomUUID().toString();
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute(AdminAuthFilter.SESSION_ADMIN_ROLE)).thenReturn("admin");
        when(session.getAttribute(AdminAuthFilter.SESSION_CSRF_TOKEN)).thenReturn(correctCsrf);

        // 1. Missing CSRF parameter -> 403 Forbidden
        when(request.getParameter("csrfToken")).thenReturn(null);
        authFilter.doFilter(request, response, chain);
        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(chain, never()).doFilter(request, response);

        // 2. Tampered / mismatch CSRF parameter -> 403 Forbidden
        when(request.getParameter("csrfToken")).thenReturn("attacker_fake_token");
        authFilter.doFilter(request, response, chain);
        verify(response, atLeastOnce()).setStatus(HttpServletResponse.SC_FORBIDDEN);

        // 3. Valid CSRF parameter -> Allowed
        when(request.getParameter("csrfToken")).thenReturn(correctCsrf);
        authFilter.doFilter(request, response, chain);
        verify(chain).doFilter(request, response);
    }
}
