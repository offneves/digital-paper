package com.digitalpaper.auth_ms.dto;

import com.digitalpaper.auth_ms.entity.enums.UserRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;


public record RegisterRequest(

    @NotBlank(message = "Login is mandatory.")
    String login,

    @NotBlank(message = "Password is mandatory.")
    String password,

    @NotBlank(message = "Name is mandatory.")
    String name,

    @NotBlank(message = "CPF is mandatory.")
    String cpf,

    @NotNull(message = "Role is mandatory.")
    UserRole userRole

) {}
