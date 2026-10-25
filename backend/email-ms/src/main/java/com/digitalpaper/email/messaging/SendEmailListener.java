package com.digitalpaper.email.messaging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import com.digitalpaper.email.composer.EmailMessage;
import com.digitalpaper.email.config.RabbitMQConfig;
import com.digitalpaper.email.dto.event.SendEmailCommand;
import com.digitalpaper.email.service.EmailService;
import lombok.RequiredArgsConstructor;


@Component
@RequiredArgsConstructor
public class SendEmailListener {

    private static final Logger log = LoggerFactory.getLogger(SendEmailListener.class);

    private final EmailService emailService;

    @RabbitListener(queues = RabbitMQConfig.QUEUE_SEND)
    public void onSendEmail(SendEmailCommand command) {
        if (command.templateKey() == null || command.recipientEmail() == null || command.recipientEmail().isBlank()) {
            log.warn("[EMAIL] [SEND] ignored command without templateKey/recipientEmail: {}", command);
            return;
        }

        emailService.dispatch(new EmailMessage(
            command.eventId(),
            command.templateKey().trim(),
            command.source(),
            command.recipientUserId(),
            command.recipientEmail(),
            command.recipientName(),
            command.variables()
        ));
    }

}
