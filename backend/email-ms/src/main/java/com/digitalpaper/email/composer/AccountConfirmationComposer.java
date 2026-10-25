package com.digitalpaper.email.composer;

import java.util.Map;
import org.springframework.stereotype.Component;
import com.digitalpaper.email.dto.event.EmailVerificationRequestedEvent;
import com.digitalpaper.email.template.SystemTemplates;
import com.digitalpaper.email.util.DurationLabels;


@Component
public class AccountConfirmationComposer implements EmailComposer<EmailVerificationRequestedEvent> {

    @Override
    public EmailMessage compose(EmailVerificationRequestedEvent event) {
        return new EmailMessage(
            event.eventId(),
            SystemTemplates.ACCOUNT_CONFIRMATION,
            "auth",
            event.userId(),
            event.email(),
            event.name(),
            Map.of(
                "name", event.name(),
                "login", event.login(),
                "actionUrl", event.verificationUrl(),
                "expiresIn", DurationLabels.fromMinutes(event.expiresInMinutes())
            )
        );
    }

}
