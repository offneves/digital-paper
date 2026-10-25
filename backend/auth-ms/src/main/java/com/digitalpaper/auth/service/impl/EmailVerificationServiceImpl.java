package com.digitalpaper.auth.service.impl;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.digitalpaper.auth.config.RabbitMQConfig;
import com.digitalpaper.auth.dto.event.EmailVerificationRequestedEvent;
import com.digitalpaper.auth.dto.request.ResendVerificationRequest;
import com.digitalpaper.auth.dto.request.VerifyEmailRequest;
import com.digitalpaper.auth.entity.EmailVerificationToken;
import com.digitalpaper.auth.entity.User;
import com.digitalpaper.auth.exception.BusinessException;
import com.digitalpaper.auth.exception.enums.ErrorCode;
import com.digitalpaper.auth.repository.EmailVerificationTokenRepository;
import com.digitalpaper.auth.repository.UserRepository;
import com.digitalpaper.auth.service.EmailVerificationService;
import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class EmailVerificationServiceImpl implements EmailVerificationService {

    private static final long RESEND_COOLDOWN_SECONDS = 60;

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository tokenRepository;
    private final OpaqueTokenService opaqueTokenService;
    private final AuthEventPublisher eventPublisher;

    @Value("${app.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Value("${app.email-verification.expiration-minutes:1440}")
    private long expirationMinutes;

    @Override
    @Transactional
    public void sendVerification(User user) {
        Instant now = Instant.now();
        tokenRepository.invalidateActiveTokensForUser(user.getId(), now);

        String rawToken = opaqueTokenService.generate();

        tokenRepository.save(EmailVerificationToken.builder()
            .user(user)
            .tokenHash(opaqueTokenService.hash(rawToken))
            .expiresAt(now.plus(expirationMinutes, ChronoUnit.MINUTES))
            .createdAt(now)
            .build());

        String verificationUrl = frontendBaseUrl.replaceAll("/$", "")
            + "/confirmar-email?token="
            + rawToken;

        eventPublisher.publishAfterCommit(
            RabbitMQConfig.ROUTING_KEY_EMAIL_VERIFICATION,
            new EmailVerificationRequestedEvent(
                UUID.randomUUID().toString(),
                user.getId(),
                user.getLogin(),
                user.getName(),
                user.getEmail(),
                verificationUrl,
                expirationMinutes
            )
        );
    }

    @Override
    @Transactional
    public void verify(VerifyEmailRequest request) {
        String tokenHash = opaqueTokenService.hash(request.token().trim());

        EmailVerificationToken token = tokenRepository.findByTokenHash(tokenHash)
            .orElseThrow(() -> new BusinessException(ErrorCode.AUTH_VERIFICATION_TOKEN_INVALID));

        Instant now = Instant.now();

        if (token.getUsedAt() != null || token.getExpiresAt().isBefore(now)) {
            throw new BusinessException(ErrorCode.AUTH_VERIFICATION_TOKEN_INVALID);
        }

        User user = token.getUser();
        if (user.getEmailVerifiedAt() == null) {
            user.setEmailVerifiedAt(LocalDateTime.now());
            userRepository.save(user);
        }

        token.setUsedAt(now);
        tokenRepository.invalidateActiveTokensForUser(user.getId(), now);
    }

    @Override
    @Transactional
    public void resend(ResendVerificationRequest request) {
        Instant cooldownStart = Instant.now().minusSeconds(RESEND_COOLDOWN_SECONDS);

        userRepository.findByEmailIgnoreCaseAndEmailVerifiedAtIsNullAndActiveTrue(request.email().trim())
            .stream()
            .filter(user -> !tokenRepository.existsByUserIdAndCreatedAtAfter(user.getId(), cooldownStart))
            .forEach(this::sendVerification);
    }

}
