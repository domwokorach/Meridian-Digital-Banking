package com.meridian.banking.auth;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {
    // Throwaway keys generated for the test run; nothing here is a real secret.
    static final String SECRET = UUID.randomUUID() + "-" + UUID.randomUUID();
    final JwtService jwt = new JwtService(SECRET);

    @Test void tokenRoundTripsTheUserId() {
        UUID id = UUID.randomUUID();
        assertEquals(id, jwt.parse(jwt.create(id)));
    }
    @Test void secretsShorterThan32BytesAreRejected() {
        assertThrows(IllegalArgumentException.class, () -> new JwtService("too-short"));
    }
    @Test void tokenSignedWithAnotherKeyIsRejected() {
        String other = new JwtService(UUID.randomUUID() + "-" + UUID.randomUUID()).create(UUID.randomUUID());
        assertThrows(JwtException.class, () -> jwt.parse(other));
    }
    @Test void tamperedTokenIsRejected() {
        String token = jwt.create(UUID.randomUUID());
        String tampered = token.substring(0, token.length() - 2) + (token.endsWith("AA") ? "BB" : "AA");
        assertThrows(JwtException.class, () -> jwt.parse(tampered));
    }
    @Test void expiredTokenIsRejected() {
        var key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        String expired = Jwts.builder().subject(UUID.randomUUID().toString())
            .issuedAt(Date.from(Instant.now().minusSeconds(7300))).expiration(Date.from(Instant.now().minusSeconds(100))).signWith(key).compact();
        assertThrows(JwtException.class, () -> jwt.parse(expired));
    }
    @Test void tokenExpiresInTwoHours() {
        var key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        var claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(jwt.create(UUID.randomUUID())).getPayload();
        long seconds = (claims.getExpiration().getTime() - claims.getIssuedAt().getTime()) / 1000;
        assertEquals(7200, seconds);
    }
    @Test void garbageIsRejected() {
        assertThrows(RuntimeException.class, () -> jwt.parse("not-a-jwt"));
    }
}
