package com.digitalpaper.auth.service.impl;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import com.digitalpaper.auth.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;


@Component
@RequiredArgsConstructor
public class AuthEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publishAfterCommit(String routingKey, Object event) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            publish(routingKey, event);
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                publish(routingKey, event);
            }
        });
    }

    private void publish(String routingKey, Object event) {
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, routingKey, event);
    }

}
