package com.digitalpaper.auth_ms.dto.event;

public record UserCreateEvent(

    Long id,
    String login,
    String email,
    String name,
    String cpfCnpj

) {}
