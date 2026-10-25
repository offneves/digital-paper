package com.digitalpaper.auth.dto.request;

import jakarta.validation.constraints.NotBlank;


public record VerifyEmailRequest(

    @NotBlank(message = "Token is mandatory.")
    String token

) {}
