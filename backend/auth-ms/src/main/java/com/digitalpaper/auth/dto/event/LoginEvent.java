package com.digitalpaper.auth.dto.event;

import java.time.LocalDateTime;


public record LoginEvent(

    String login,
    String status,
    LocalDateTime timestamp

) {}
