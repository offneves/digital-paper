package com.digitalpaper.email.dto.request;

import jakarta.validation.constraints.NotNull;


public record EmailTemplateEnabledRequest(

    @NotNull(message = "Enabled is mandatory.")
    Boolean enabled

) {}
