package com.digitalpaper.auth_ms.dto;

import jakarta.validation.constraints.NotBlank;


public record LoginRequest(

    @NotBlank(message = "Login is mandatory.")
    String login,

    @NotBlank(message = "Password is mandatory.")
    String password

) {}
