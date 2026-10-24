package com.digitalpaper.notification.service.impl;

import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;


@Service
public class TokenService {

    @Value("${app.jwt.secret:K7mPq2Xv9LdR4sTf8NyWa1BcHu6ZjQeN}")
    private String tokenSecret;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(tokenSecret.getBytes(StandardCharsets.UTF_8));
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

}
