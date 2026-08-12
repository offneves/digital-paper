package com.digitalpaper.auth_ms.service.impl;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import com.digitalpaper.auth_ms.entity.User;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;


@Service
public class TokenService {

    private final String TOKEN_SECRET = "K7mPq2Xv9LdR4sTf8NyWa1BcHu6ZjQeN";
    private final Long EXPIRATION_TIME = 7200000L;

    public String generateToken(User user) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(TOKEN_SECRET.getBytes(StandardCharsets.UTF_8));

            return Jwts.builder()
            .subject(user.getLogin())
            .claim("id", user.getId())
            .claim("role", user.getRole().name())
            .claim("name", user.getName())
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
            .signWith(key)
            .compact();
        } catch (Exception e) {
            throw new RuntimeException("Error to generate JWT token's user: " + user);
        }
    }

}
