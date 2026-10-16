package com.digitalpaper.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;


public record ForgotPasswordRequest(

    @NotBlank(message = "E-mail is mandatory.")
    @Email(message = "E-mail must be valid.")
    String email

) {}
