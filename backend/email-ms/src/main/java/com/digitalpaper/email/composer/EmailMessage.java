package com.digitalpaper.email.composer;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public record EmailMessage(

    String eventId,
    String templateKey,
    String source,
    Long recipientUserId,
    String recipientEmail,
    String recipientName,
    Map<String, String> variables

) {

    public EmailMessage {
        variables = variables == null
            ? Map.of()
            : Collections.unmodifiableMap(new HashMap<>(variables));
    }

}
