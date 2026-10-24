package com.digitalpaper.notification.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;


@Configuration
public class RestClientConfig {

    @Bean
    public RestClient authRestClient(
        @Value("${app.auth.base-url:http://localhost:8081}") String authBaseUrl
    ) {
        return RestClient.builder()
            .baseUrl(authBaseUrl)
            .build();
    }

}
