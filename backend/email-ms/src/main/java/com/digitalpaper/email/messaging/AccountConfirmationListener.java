package com.digitalpaper.email.messaging;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import com.digitalpaper.email.composer.AccountConfirmationComposer;
import com.digitalpaper.email.config.RabbitMQConfig;
import com.digitalpaper.email.dto.event.EmailVerificationRequestedEvent;
import com.digitalpaper.email.service.EmailService;
import lombok.RequiredArgsConstructor;


@Component
@RequiredArgsConstructor
public class AccountConfirmationListener {

    private final AccountConfirmationComposer composer;
    private final EmailService emailService;

    @RabbitListener(queues = RabbitMQConfig.QUEUE_ACCOUNT_CONFIRMATION)
    public void onEmailVerificationRequested(EmailVerificationRequestedEvent event) {
        emailService.dispatch(composer.compose(event));
    }

}
