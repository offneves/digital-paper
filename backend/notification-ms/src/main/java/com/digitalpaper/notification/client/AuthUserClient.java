package com.digitalpaper.notification.client;

import java.util.Arrays;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;


@Component
public class AuthUserClient {

    private static final Logger log = LoggerFactory.getLogger(AuthUserClient.class);

    private final RestClient authRestClient;
    private final String internalApiKey;

    public AuthUserClient(
        RestClient authRestClient,
        @Value("${app.internal-api-key:}") String internalApiKey
    ) {
        this.authRestClient = authRestClient;
        this.internalApiKey = internalApiKey;
    }

    public List<Long> listUserIdsByRole(String role) {
        if (internalApiKey == null || internalApiKey.isBlank()) {
            log.warn(
                "[NOTIFICATION] [AUTH_CLIENT] internal API key is empty; cannot resolve user ids (role={})",
                role
            );
            return List.of();
        }

        try {
            Long[] ids = authRestClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/internal/user/ids")
                    .queryParam("role", role)
                    .build())
                .header("X-Internal-Key", internalApiKey)
                .retrieve()
                .body(Long[].class);

            if (ids == null) {
                return List.of();
            }
            return Arrays.asList(ids);
        } catch (Exception ex) {
            log.error(
                "[NOTIFICATION] [AUTH_CLIENT] failed to resolve user ids (role={})",
                role,
                ex
            );
            return List.of();
        }
    }

}
