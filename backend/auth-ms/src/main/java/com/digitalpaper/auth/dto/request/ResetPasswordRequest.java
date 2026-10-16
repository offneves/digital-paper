package com.digitalpaper.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;


public record ResetPasswordRequest(

    @NotBlank(message = "Token is mandatory.")
    String token,

    @NotBlank(message = "Password is mandatory.")
    @Size(min = 8, message = "Password must have at least 8 characters.")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$",
        message = "Password must contain uppercase, lowercase, number and symbol."
    )
    String password

) {}
