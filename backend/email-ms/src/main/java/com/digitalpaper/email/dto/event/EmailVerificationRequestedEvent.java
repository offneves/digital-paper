package com.digitalpaper.email.dto.event;


public record EmailVerificationRequestedEvent(

    String eventId,
    Long userId,
    String login,
    String name,
    String email,
    String verificationUrl,
    long expiresInMinutes

) {}
