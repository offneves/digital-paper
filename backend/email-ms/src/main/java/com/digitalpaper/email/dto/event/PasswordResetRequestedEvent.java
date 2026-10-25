package com.digitalpaper.email.dto.event;


public record PasswordResetRequestedEvent(

    String eventId,
    Long userId,
    String login,
    String name,
    String email,
    String resetUrl,
    long expiresInMinutes

) {}
