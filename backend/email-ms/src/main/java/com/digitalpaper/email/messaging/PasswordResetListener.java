package com.digitalpaper.email.messaging;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import com.digitalpaper.email.composer.PasswordResetComposer;
import com.digitalpaper.email.config.RabbitMQConfig;
import com.digitalpaper.email.dto.event.PasswordResetRequestedEvent;
import com.digitalpaper.email.service.EmailService;
import lombok.RequiredArgsConstructor;


@Component
@RequiredArgsConstructor
public class PasswordResetListener {

    private final PasswordResetComposer composer;
    private final EmailService emailService;

    @RabbitListener(queues = RabbitMQConfig.QUEUE_PASSWORD_RESET)
    public void onPasswordResetRequested(PasswordResetRequestedEvent event) {
        emailService.dispatch(composer.compose(event));
    }

}
