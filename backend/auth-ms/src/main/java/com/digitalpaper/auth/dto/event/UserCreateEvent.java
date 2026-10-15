package com.digitalpaper.auth.dto.event;

public record UserCreateEvent(

    Long id,
    String login,
    String email,
    String name,
    String cpfCnpj

) {}
