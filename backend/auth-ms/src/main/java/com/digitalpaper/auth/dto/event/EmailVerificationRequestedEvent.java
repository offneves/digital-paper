package com.digitalpaper.auth.dto.event;


public record EmailVerificationRequestedEvent(

    String eventId,
    Long userId,
    String login,
    String name,
    String email,
    String verificationUrl,
    long expiresInMinutes

) {}
