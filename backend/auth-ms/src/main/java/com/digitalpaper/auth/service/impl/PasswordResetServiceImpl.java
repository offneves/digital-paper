package com.digitalpaper.auth.service.impl;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.digitalpaper.auth.exception.enums.ErrorCode;
import com.digitalpaper.auth.dto.request.ForgotPasswordRequest;
import com.digitalpaper.auth.dto.request.ResetPasswordRequest;
import com.digitalpaper.auth.entity.PasswordResetToken;
import com.digitalpaper.auth.entity.User;
import com.digitalpaper.auth.exception.BusinessException;
import com.digitalpaper.auth.repository.PasswordResetTokenRepository;
import com.digitalpaper.auth.repository.UserRepository;
import com.digitalpaper.auth.service.PasswordResetService;
import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class PasswordResetServiceImpl implements PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetServiceImpl.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Value("${app.password-reset.expiration-minutes:60}")
    private long expirationMinutes;

    @Override
    @Transactional
    public void requestReset(ForgotPasswordRequest request) {
        String email = request.email().trim();

        userRepository.findFirstByEmailIgnoreCaseOrderByIdAsc(email).ifPresent(user -> {
            if (!Boolean.TRUE.equals(user.getActive())) {
                return;
            }

            Instant now = Instant.now();
            passwordResetTokenRepository.invalidateActiveTokensForUser(user.getId(), now);

            String rawToken = generateRawToken();

            PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .tokenHash(hashToken(rawToken))
                .expiresAt(now.plus(expirationMinutes, ChronoUnit.MINUTES))
                .createdAt(now)
                .build();

            passwordResetTokenRepository.save(resetToken);

            String resetUrl = frontendBaseUrl.replaceAll("/$", "")
                + "/redefinir-senha?token="
                + rawToken;

            log.info(
                "Password reset link for user {} ({}): {}",
                user.getLogin(),
                user.getEmail(),
                resetUrl
            );
        });
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String tokenHash = hashToken(request.token().trim());

        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(tokenHash)
            .orElseThrow(() -> new BusinessException(ErrorCode.AUTH_RESET_TOKEN_INVALID));

        Instant now = Instant.now();

        if (resetToken.getUsedAt() != null || resetToken.getExpiresAt().isBefore(now)) {
            throw new BusinessException(ErrorCode.AUTH_RESET_TOKEN_INVALID);
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setUpdatedAt(java.time.LocalDateTime.now());
        userRepository.save(user);

        resetToken.setUsedAt(now);
        passwordResetTokenRepository.invalidateActiveTokensForUser(user.getId(), now);
    }

    private String generateRawToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

}
