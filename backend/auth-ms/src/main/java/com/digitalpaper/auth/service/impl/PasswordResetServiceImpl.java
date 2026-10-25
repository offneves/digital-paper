package com.digitalpaper.auth.service.impl;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.digitalpaper.auth.config.RabbitMQConfig;
import com.digitalpaper.auth.dto.event.PasswordResetRequestedEvent;
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

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final OpaqueTokenService opaqueTokenService;
    private final AuthEventPublisher eventPublisher;

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

            String rawToken = opaqueTokenService.generate();

            PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .tokenHash(opaqueTokenService.hash(rawToken))
                .expiresAt(now.plus(expirationMinutes, ChronoUnit.MINUTES))
                .createdAt(now)
                .build();

            passwordResetTokenRepository.save(resetToken);

            String resetUrl = frontendBaseUrl.replaceAll("/$", "")
                + "/redefinir-senha?token="
                + rawToken;

            eventPublisher.publishAfterCommit(
                RabbitMQConfig.ROUTING_KEY_PASSWORD_RESET,
                new PasswordResetRequestedEvent(
                    UUID.randomUUID().toString(),
                    user.getId(),
                    user.getLogin(),
                    user.getName(),
                    user.getEmail(),
                    resetUrl,
                    expirationMinutes
                )
            );

            log.info("Password reset requested for user {} (id={})", user.getLogin(), user.getId());
        });
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String tokenHash = opaqueTokenService.hash(request.token().trim());

        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(tokenHash)
            .orElseThrow(() -> new BusinessException(ErrorCode.AUTH_RESET_TOKEN_INVALID));

        Instant now = Instant.now();

        if (resetToken.getUsedAt() != null || resetToken.getExpiresAt().isBefore(now)) {
            throw new BusinessException(ErrorCode.AUTH_RESET_TOKEN_INVALID);
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setUpdatedAt(java.time.LocalDateTime.now());
        if (user.getEmailVerifiedAt() == null) {
            user.setEmailVerifiedAt(java.time.LocalDateTime.now());
        }
        userRepository.save(user);

        resetToken.setUsedAt(now);
        passwordResetTokenRepository.invalidateActiveTokensForUser(user.getId(), now);
    }

}
