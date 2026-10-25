package com.digitalpaper.email.dto.response;

import java.time.LocalDateTime;


public record EmailAttemptResponse(

    int attemptNumber,
    boolean success,
    String error,
    long durationMs,
    LocalDateTime attemptedAt

) {}
