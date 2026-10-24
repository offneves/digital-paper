package com.digitalpaper.notification.dto.response;

import java.time.LocalDateTime;
import com.digitalpaper.notification.entity.enums.AnnouncementAudience;
import com.digitalpaper.notification.entity.enums.NotificationType;
import lombok.Builder;


@Builder
public record AnnouncementResponse(

    Long id,
    String title,
    String body,
    NotificationType type,
    AnnouncementAudience audience,
    String audienceRef,
    String link,
    Long createdBy,
    LocalDateTime publishedAt,
    LocalDateTime createdAt,
    LocalDateTime updatedAt

) {}
