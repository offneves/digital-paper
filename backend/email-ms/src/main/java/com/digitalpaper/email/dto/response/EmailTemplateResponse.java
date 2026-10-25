package com.digitalpaper.email.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;


@Builder
public record EmailTemplateResponse(

    Long id,
    String templateKey,
    String name,
    String description,
    boolean systemTemplate,
    boolean enabled,
    boolean sensitive,
    String subject,
    String preheader,
    String eyebrow,
    String heading,
    String body,
    String buttonLabel,
    String buttonUrl,
    String notice,
    String footerNote,
    List<String> variables,
    long sentLast30Days,
    LocalDateTime lastSentAt,
    LocalDateTime createdAt,
    LocalDateTime updatedAt

) {}
