package com.digitalpaper.notification.dto.response;

import java.time.LocalDateTime;
import com.digitalpaper.notification.entity.enums.NotificationType;
import lombok.Builder;


@Builder
public record NotificationResponse(

    Long id,
    Long recipientUserId,
    Long announcementId,
    NotificationType type,
    String title,
    String body,
    String link,
    String source,
    LocalDateTime readAt,
    LocalDateTime deletedAt,
    LocalDateTime createdAt,
    boolean read,
    boolean deleted

) {}
