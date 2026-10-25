package com.digitalpaper.email.dto.event;

import java.util.Map;


public record SendEmailCommand(

    String eventId,
    String templateKey,
    String source,
    Long recipientUserId,
    String recipientEmail,
    String recipientName,
    Map<String, String> variables

) {}
