package com.digitalpaper.notification.dto.request;

import java.util.List;
import com.digitalpaper.notification.entity.enums.AnnouncementAudience;
import com.digitalpaper.notification.entity.enums.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;


public record CreateAnnouncementRequest(

    @NotBlank(message = "Title is mandatory.")
    String title,

    @NotBlank(message = "Body is mandatory.")
    String body,

    @NotNull(message = "Type is mandatory.")
    NotificationType type,

    @NotNull(message = "Audience is mandatory.")
    AnnouncementAudience audience,

    String audienceRef,

    String link,

    List<Long> recipientUserIds

) {}
