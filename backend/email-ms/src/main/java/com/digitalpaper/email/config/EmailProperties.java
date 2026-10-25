package com.digitalpaper.email.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;


@ConfigurationProperties(prefix = "app.mail")
public record EmailProperties(

    String from,
    String fromName,
    boolean dryRun,
    Retry retry

) {

    public record Retry(

        int maxAttempts,
        Duration initialDelay,
        Duration maxDelay,
        int batchSize

    ) {}

}
