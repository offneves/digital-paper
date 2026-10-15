package com.digitalpaper.auth.dto.request;

import com.digitalpaper.auth.entity.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;


public record RegisterRequest(

    @NotBlank(message = "Login is mandatory.")
    String login,

    @NotBlank(message = "Password is mandatory.")
    @Size(min = 8, message = "Password must have at least 8 characters.")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$",
        message = "Password must contain uppercase, lowercase, number and symbol."
    )
    String password,

    @NotBlank(message = "E-mail is mandatory.")
    @Email(message = "E-mail must be valid.")
    String email,

    @NotBlank(message = "Name is mandatory.")
    String name,

    @NotBlank(message = "CPF/CNPJ is mandatory.")
    @Pattern(
        regexp = "^(\\d{11}|\\d{14})$",
        message = "CPF/CNPJ must contain 11 or 14 digits."
    )
    String cpfCnpj,

    @NotNull(message = "Role is mandatory.")
    UserRole userRole

) {}
