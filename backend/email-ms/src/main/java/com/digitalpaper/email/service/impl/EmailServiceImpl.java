package com.digitalpaper.email.service.impl;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.digitalpaper.email.composer.EmailMessage;
import com.digitalpaper.email.config.EmailProperties;
import com.digitalpaper.email.dto.response.EmailAttemptResponse;
import com.digitalpaper.email.dto.response.EmailDetailResponse;
import com.digitalpaper.email.dto.response.EmailResponse;
import com.digitalpaper.email.dto.response.PageResponse;
import com.digitalpaper.email.entity.Email;
import com.digitalpaper.email.entity.EmailAttempt;
import com.digitalpaper.email.entity.EmailTemplate;
import com.digitalpaper.email.entity.enums.EmailStatus;
import com.digitalpaper.email.exception.BusinessException;
import com.digitalpaper.email.exception.EmailDeliveryException;
import com.digitalpaper.email.exception.enums.ErrorCode;
import com.digitalpaper.email.repository.EmailAttemptRepository;
import com.digitalpaper.email.repository.EmailRepository;
import com.digitalpaper.email.repository.EmailTemplateRepository;
import com.digitalpaper.email.service.EmailSender;
import com.digitalpaper.email.service.EmailService;
import com.digitalpaper.email.template.Placeholders;
import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);
    private static final int MAX_ERROR_LENGTH = 2000;

    private final EmailRepository emailRepository;
    private final EmailAttemptRepository emailAttemptRepository;
    private final EmailTemplateRepository emailTemplateRepository;
    private final EmailRenderer emailRenderer;
    private final EmailSender emailSender;
    private final EmailProperties properties;

    @Override
    public void dispatch(EmailMessage message) {
        if (message.eventId() != null && emailRepository.existsByEventId(message.eventId())) {
            log.info("[EMAIL] [{}] skipped — event {} already processed", message.templateKey(), message.eventId());
            return;
        }

        EmailTemplate template = emailTemplateRepository.findByTemplateKey(message.templateKey()).orElse(null);

        if (template == null) {
            Email email = baseEmail(message, message.templateKey(), false);
            email.setStatus(EmailStatus.FAILED);
            email.setLastError("Template '" + message.templateKey() + "' não existe.");
            emailRepository.save(email);
            log.error("[EMAIL] [{}] template not found — e-mail to {} recorded as FAILED",
                message.templateKey(), message.recipientEmail());
            return;
        }

        if (!Boolean.TRUE.equals(template.getEnabled())) {
            Email email = baseEmail(message, Placeholders.text(template.getSubject(), message.variables()),
                Boolean.TRUE.equals(template.getSensitive()));
            email.setStatus(EmailStatus.SKIPPED);
            email.setLastError("Template desativado.");
            emailRepository.save(email);
            log.info("[EMAIL] [{}] template disabled — e-mail to {} skipped",
                message.templateKey(), message.recipientEmail());
            return;
        }

        deliver(template, message);
    }

    @Override
    public EmailResponse sendTest(EmailTemplate template, String to, Map<String, String> variables) {
        EmailMessage message = new EmailMessage(
            null,
            template.getTemplateKey(),
            "admin-test",
            null,
            to,
            null,
            variables
        );
        return toResponse(deliver(template, message));
    }

    private Email deliver(EmailTemplate template, EmailMessage message) {
        EmailRenderer.RenderedEmail rendered = emailRenderer.render(template, message.variables());

        Email email = baseEmail(message, rendered.subject(), Boolean.TRUE.equals(template.getSensitive()));
        email.setStatus(EmailStatus.PENDING);
        email.setBody(rendered.html());

        emailRepository.save(email);
        attempt(email, true);
        return email;
    }

    private Email baseEmail(EmailMessage message, String subject, boolean sensitive) {
        return Email.builder()
            .eventId(message.eventId())
            .templateKey(message.templateKey())
            .sensitive(sensitive)
            .source(message.source() == null || message.source().isBlank() ? "unknown" : message.source())
            .recipientUserId(message.recipientUserId())
            .recipientEmail(message.recipientEmail().trim())
            .recipientName(message.recipientName())
            .subject(subject == null || subject.isBlank() ? message.templateKey() : truncate(subject, 255))
            .attempts(0)
            .maxAttempts(Math.max(properties.retry().maxAttempts(), 1))
            .createdAt(LocalDateTime.now())
            .build();
    }

    @Override
    public int retryDue() {
        List<Email> due = emailRepository.findDue(
            EmailStatus.RETRYING,
            LocalDateTime.now(),
            PageRequest.of(0, properties.retry().batchSize())
        );

        due.forEach(email -> attempt(email, true));
        return due.size();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<EmailResponse> list(String q, EmailStatus status, String templateKey, int page, int size) {
        String query = q == null ? "" : q.trim();
        String key = templateKey == null || templateKey.isBlank() ? null : templateKey.trim();
        Page<Email> result = emailRepository.search(query, status, key, buildPageable(page, size));

        return PageResponse.<EmailResponse>builder()
            .content(result.getContent().stream().map(EmailServiceImpl::toResponse).toList())
            .page(result.getNumber())
            .size(result.getSize())
            .totalElements(result.getTotalElements())
            .totalPages(result.getTotalPages())
            .build();
    }

    @Override
    @Transactional(readOnly = true)
    public EmailDetailResponse get(Long id) {
        return toDetail(findOrThrow(id));
    }

    @Override
    public EmailDetailResponse resend(Long id) {
        Email email = findOrThrow(id);

        if (email.getStatus() == EmailStatus.SENT) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_SENT);
        }
        if (email.getBody() == null) {
            throw new BusinessException(ErrorCode.EMAIL_CONTENT_UNAVAILABLE);
        }

        attempt(email, false);
        return toDetail(email);
    }

    private void attempt(Email email, boolean scheduleRetry) {
        int attemptNumber = email.getAttempts() + 1;
        long start = System.nanoTime();
        String error = null;

        try {
            emailSender.send(
                email.getRecipientEmail(),
                email.getRecipientName(),
                email.getSubject(),
                email.getBody()
            );
        } catch (EmailDeliveryException e) {
            error = truncate(e.getMessage(), MAX_ERROR_LENGTH);
        } catch (RuntimeException e) {
            error = truncate(e.getClass().getSimpleName() + ": " + e.getMessage(), MAX_ERROR_LENGTH);
        }

        LocalDateTime now = LocalDateTime.now();
        long durationMs = Duration.ofNanos(System.nanoTime() - start).toMillis();

        email.setAttempts(attemptNumber);
        email.setUpdatedAt(now);

        if (error == null) {
            email.setStatus(EmailStatus.SENT);
            email.setSentAt(now);
            email.setNextAttemptAt(null);
            email.setLastError(null);
            if (Boolean.TRUE.equals(email.getSensitive())) {
                email.setBody(null);
            }
            log.info(
                "[EMAIL] [{}] sent to {} (id={}, attempt={})",
                email.getTemplateKey(), email.getRecipientEmail(), email.getId(), attemptNumber
            );
        } else if (scheduleRetry && attemptNumber < email.getMaxAttempts()) {
            email.setStatus(EmailStatus.RETRYING);
            email.setLastError(error);
            email.setNextAttemptAt(now.plus(backoff(attemptNumber)));
            log.warn(
                "[EMAIL] [{}] failed for {} (id={}, attempt={}/{}), retry at {}: {}",
                email.getTemplateKey(), email.getRecipientEmail(), email.getId(),
                attemptNumber, email.getMaxAttempts(), email.getNextAttemptAt(), error
            );
        } else {
            email.setStatus(EmailStatus.FAILED);
            email.setLastError(error);
            email.setNextAttemptAt(null);
            log.error(
                "[EMAIL] [{}] gave up on {} (id={}, attempt={}): {}",
                email.getTemplateKey(), email.getRecipientEmail(), email.getId(), attemptNumber, error
            );
        }

        emailRepository.save(email);
        emailAttemptRepository.save(EmailAttempt.builder()
            .email(email)
            .attemptNumber(attemptNumber)
            .success(error == null)
            .error(error)
            .durationMs(durationMs)
            .attemptedAt(now)
            .build());
    }

    private Duration backoff(int attemptNumber) {
        Duration initial = properties.retry().initialDelay();
        Duration max = properties.retry().maxDelay();
        Duration delay = initial.multipliedBy(1L << Math.min(attemptNumber - 1, 20));
        return delay.compareTo(max) > 0 ? max : delay;
    }

    private Email findOrThrow(Long id) {
        return emailRepository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.EMAIL_NOT_FOUND));
    }

    private Pageable buildPageable(int page, int size) {
        int safeSize = switch (size) {
            case 5, 10, 25, 50 -> size;
            default -> 25;
        };

        return PageRequest.of(
            Math.max(page, 0),
            safeSize,
            Sort.by(Sort.Direction.DESC, "createdAt")
        );
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return "Unknown error";
        }
        return value.length() > max ? value.substring(0, max) : value;
    }

    private EmailDetailResponse toDetail(Email email) {
        List<EmailAttemptResponse> attempts = emailAttemptRepository
            .findByEmailIdOrderByAttemptNumberAsc(email.getId())
            .stream()
            .map(attempt -> new EmailAttemptResponse(
                attempt.getAttemptNumber(),
                Boolean.TRUE.equals(attempt.getSuccess()),
                attempt.getError(),
                attempt.getDurationMs(),
                attempt.getAttemptedAt()
            ))
            .toList();

        String body = Boolean.TRUE.equals(email.getSensitive()) ? null : email.getBody();
        return new EmailDetailResponse(toResponse(email), body, attempts);
    }

    private static EmailResponse toResponse(Email email) {
        return EmailResponse.builder()
            .id(email.getId())
            .templateKey(email.getTemplateKey())
            .sensitive(Boolean.TRUE.equals(email.getSensitive()))
            .status(email.getStatus())
            .source(email.getSource())
            .recipientUserId(email.getRecipientUserId())
            .recipientEmail(email.getRecipientEmail())
            .recipientName(email.getRecipientName())
            .subject(email.getSubject())
            .attempts(email.getAttempts())
            .maxAttempts(email.getMaxAttempts())
            .lastError(email.getLastError())
            .nextAttemptAt(email.getNextAttemptAt())
            .sentAt(email.getSentAt())
            .createdAt(email.getCreatedAt())
            .updatedAt(email.getUpdatedAt())
            .build();
    }

}
