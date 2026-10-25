package com.digitalpaper.email.composer;

import java.util.Map;
import org.springframework.stereotype.Component;
import com.digitalpaper.email.dto.event.PasswordResetRequestedEvent;
import com.digitalpaper.email.template.SystemTemplates;
import com.digitalpaper.email.util.DurationLabels;


@Component
public class PasswordResetComposer implements EmailComposer<PasswordResetRequestedEvent> {

    @Override
    public EmailMessage compose(PasswordResetRequestedEvent event) {
        return new EmailMessage(
            event.eventId(),
            SystemTemplates.PASSWORD_RESET,
            "auth",
            event.userId(),
            event.email(),
            event.name(),
            Map.of(
                "name", event.name(),
                "login", event.login(),
                "actionUrl", event.resetUrl(),
                "expiresIn", DurationLabels.fromMinutes(event.expiresInMinutes())
            )
        );
    }

}
