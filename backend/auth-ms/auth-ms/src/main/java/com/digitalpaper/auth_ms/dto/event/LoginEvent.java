package com.digitalpaper.auth_ms.dto.event;

import java.time.LocalDateTime;

public record LoginEvent(

    String login,
    String status,
    LocalDateTime timestamp

) {}
