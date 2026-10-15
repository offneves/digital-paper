package com.digitalpaper.auth.dto.request;

import jakarta.validation.constraints.NotBlank;


public record ProfileRequest(

    @NotBlank(message = "Profile Name is mandatory.")
    String profileName,
    Boolean active

) {}
