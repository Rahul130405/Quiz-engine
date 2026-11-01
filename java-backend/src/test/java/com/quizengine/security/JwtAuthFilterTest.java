package com.quizengine.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

class JwtAuthFilterTest {

    private final String secret = "test_shared_jwt_secret_key_12345";
    private Algorithm algorithm;
    private JWTVerifier verifier;

    @BeforeEach
    void setUp() {
        algorithm = Algorithm.HMAC256(secret);
        verifier = JWT.require(algorithm).build();
    }

    @Test
    @DisplayName("13. JWT verification validates HS256 signature and extracts user identity")
    void testJwtVerificationSuccess() {
        // Generate a token matching Node.js payload: { id: "user_12345", role: "user" }
        String token = JWT.create()
                .withClaim("id", "user_12345")
                .withClaim("role", "user")
                .withExpiresAt(new Date(System.currentTimeMillis() + 60 * 60 * 1000))
                .sign(algorithm);

        DecodedJWT decoded = assertDoesNotThrow(() -> verifier.verify(token));
        assertNotNull(decoded);
        assertEquals("user_12345", decoded.getClaim("id").asString());
        assertEquals("user", decoded.getClaim("role").asString());
    }

    @Test
    @DisplayName("13. JWT verification rejects expired tokens")
    void testJwtExpiredToken() {
        // Expired 10 seconds ago
        String expiredToken = JWT.create()
                .withClaim("id", "user_12345")
                .withExpiresAt(new Date(System.currentTimeMillis() - 10000))
                .sign(algorithm);

        assertThrows(JWTVerificationException.class, () -> verifier.verify(expiredToken),
                "Verifier must reject expired tokens");
    }

    @Test
    @DisplayName("13. JWT verification rejects tampered signature or invalid secret")
    void testJwtInvalidSecret() {
        Algorithm wrongAlgorithm = Algorithm.HMAC256("wrong_secret_key_attack");
        String forgedToken = JWT.create()
                .withClaim("id", "admin_user")
                .withExpiresAt(new Date(System.currentTimeMillis() + 60 * 60 * 1000))
                .sign(wrongAlgorithm);

        assertThrows(JWTVerificationException.class, () -> verifier.verify(forgedToken),
                "Verifier must reject tokens signed with an invalid secret");
    }
}
