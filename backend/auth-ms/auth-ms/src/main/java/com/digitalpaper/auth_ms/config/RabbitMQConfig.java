package com.digitalpaper.auth_ms.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.json.JsonMapper;


@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "auth.exchange";
    public static final String QUEUE_AUDIT = "auth.queue.audit";
    public static final String QUEUE_NOTIFY = "auth.queue.notification";

    public static final String ROUTING_KEY_SUCCESS = "user.login.success";
    public static final String ROUTING_KEY_FAILED = "user.login.failed";
    public static final String ROUTING_KEY_CREATED = "user.created";
    public static final String ROUTING_KEY_ALL_EVENTS = "user.login.#";

    @Bean
    public TopicExchange authExchange() {
        return new TopicExchange(EXCHANGE_NAME);
    }

    @Bean
    public Queue auditQueue() {
        return QueueBuilder.durable(QUEUE_AUDIT).build();
    }

    @Bean
    public Queue notificationQueue() {
        return QueueBuilder.durable(QUEUE_NOTIFY).build();
    }

    @Bean
    public Binding bindingAudit(Queue auditQueue, TopicExchange authExchange) {
        return BindingBuilder
        .bind(auditQueue())
        .to(authExchange())
        .with(ROUTING_KEY_SUCCESS);
    }

    @Bean
    public Binding bindingUserCreated(Queue notificationQueue, TopicExchange authExchange) {
        return BindingBuilder
        .bind(notificationQueue())
        .to(authExchange())
        .with(ROUTING_KEY_CREATED);
    }

    @Bean
    public Binding bindingNotification(Queue notificationQueue, TopicExchange authExchange) {
        return BindingBuilder
        .bind(notificationQueue())
        .to(authExchange())
        .with(ROUTING_KEY_ALL_EVENTS);
    }

    @Bean
    public MessageConverter messageConverter(JsonMapper jsonMapper) {
        return new JacksonJsonMessageConverter(jsonMapper);
    }

}
