package com.digitalpaper.notification.config;

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

    public static final String AUTH_EXCHANGE = "auth.exchange";
    public static final String QUEUE_USER_CREATED = "notification.queue.user-created";
    public static final String ROUTING_KEY_USER_CREATED = "user.created";

    @Bean
    public TopicExchange authExchange() {
        return new TopicExchange(AUTH_EXCHANGE);
    }

    @Bean
    public Queue userCreatedQueue() {
        return QueueBuilder.durable(QUEUE_USER_CREATED).build();
    }

    @Bean
    public Binding bindingUserCreated(Queue userCreatedQueue, TopicExchange authExchange) {
        return BindingBuilder
            .bind(userCreatedQueue)
            .to(authExchange)
            .with(ROUTING_KEY_USER_CREATED);
    }

    @Bean
    public MessageConverter messageConverter(JsonMapper jsonMapper) {
        return new JacksonJsonMessageConverter(jsonMapper);
    }

}
