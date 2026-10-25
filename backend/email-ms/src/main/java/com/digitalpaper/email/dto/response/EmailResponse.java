package com.digitalpaper.email.dto.response;

import java.time.LocalDateTime;
import com.digitalpaper.email.entity.enums.EmailStatus;
import lombok.Builder;


@Builder
public record EmailResponse(

    Long id,
    String templateKey,
    boolean sensitive,
    EmailStatus status,
    String source,
    Long recipientUserId,
    String recipientEmail,
    String recipientName,
    String subject,
    int attempts,
    int maxAttempts,
    String lastError,
    LocalDateTime nextAttemptAt,
    LocalDateTime sentAt,
    LocalDateTime createdAt,
    LocalDateTime updatedAt

) {}
