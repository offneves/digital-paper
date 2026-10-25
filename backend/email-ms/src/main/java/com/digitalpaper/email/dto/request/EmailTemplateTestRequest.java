package com.digitalpaper.email.dto.request;

import java.util.Map;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;


public record EmailTemplateTestRequest(

    @NotBlank(message = "Recipient is mandatory.")
    @Email(message = "Recipient must be a valid e-mail.")
    String to,

    Map<String, String> variables

) {}
