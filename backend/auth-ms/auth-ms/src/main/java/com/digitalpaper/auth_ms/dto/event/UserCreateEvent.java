package com.digitalpaper.auth_ms.dto.event;

public record UserCreateEvent(

    Long id,
    String login,
    String name,
    String cpf

) {}
