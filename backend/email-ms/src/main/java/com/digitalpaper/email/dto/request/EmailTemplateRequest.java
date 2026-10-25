package com.digitalpaper.email.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;


public record EmailTemplateRequest(

    @Size(max = 64)
    String templateKey,

    @NotBlank(message = "Name is mandatory.")
    @Size(max = 120)
    String name,

    @Size(max = 500)
    String description,

    Boolean sensitive,

    @NotBlank(message = "Subject is mandatory.")
    @Size(max = 255)
    String subject,

    @Size(max = 255)
    String preheader,

    @Size(max = 80)
    String eyebrow,

    @NotBlank(message = "Heading is mandatory.")
    @Size(max = 255)
    String heading,

    @NotBlank(message = "Body is mandatory.")
    @Size(max = 20000)
    String body,

    @Size(max = 80)
    String buttonLabel,

    @Size(max = 1000)
    String buttonUrl,

    @Size(max = 2000)
    String notice,

    @Size(max = 2000)
    String footerNote

) {}
