package com.digitalpaper.email.config;

import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Declarables;
import org.springframework.amqp.core.Exchange;
import org.springframework.amqp.core.FanoutExchange;
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

    public static final String EMAIL_EXCHANGE = "email.exchange";
    public static final String QUEUE_SEND = "email.queue.send";
    public static final String ROUTING_KEY_SEND = "email.send";

    public static final String EMAIL_DLX = "email.dlx";
    public static final String QUEUE_DLQ = "email.queue.dlq";

    public static final String QUEUE_ACCOUNT_CONFIRMATION = "email.queue.account-confirmation";
    public static final String ROUTING_KEY_EMAIL_VERIFICATION = "user.email-verification.requested";

    public static final String QUEUE_PASSWORD_RESET = "email.queue.password-reset";
    public static final String ROUTING_KEY_PASSWORD_RESET = "user.password-reset.requested";

    @Bean
    public TopicExchange authExchange() {
        return new TopicExchange(AUTH_EXCHANGE);
    }

    @Bean
    public TopicExchange emailExchange() {
        return new TopicExchange(EMAIL_EXCHANGE);
    }

    @Bean
    public Declarables deadLetter() {
        FanoutExchange dlx = new FanoutExchange(EMAIL_DLX);
        Queue dlq = QueueBuilder.durable(QUEUE_DLQ).build();
        return new Declarables(dlx, dlq, BindingBuilder.bind(dlq).to(dlx));
    }

    @Bean
    public Declarables sendQueue(TopicExchange emailExchange) {
        return emailQueue(QUEUE_SEND, emailExchange, ROUTING_KEY_SEND);
    }

    @Bean
    public Declarables accountConfirmationQueue(TopicExchange authExchange) {
        return emailQueue(QUEUE_ACCOUNT_CONFIRMATION, authExchange, ROUTING_KEY_EMAIL_VERIFICATION);
    }

    @Bean
    public Declarables passwordResetQueue(TopicExchange authExchange) {
        return emailQueue(QUEUE_PASSWORD_RESET, authExchange, ROUTING_KEY_PASSWORD_RESET);
    }

    @Bean
    public MessageConverter messageConverter(JsonMapper jsonMapper) {
        return new JacksonJsonMessageConverter(jsonMapper);
    }

    private static Declarables emailQueue(String queueName, Exchange exchange, String routingKey) {
        Queue queue = QueueBuilder.durable(queueName)
            .deadLetterExchange(EMAIL_DLX)
            .build();

        return new Declarables(
            queue,
            BindingBuilder.bind(queue).to(exchange).with(routingKey).noargs()
        );
    }

}
