package com.digitalpaper.email.dto.request;

import java.util.Map;


public record EmailTemplatePreviewRequest(

    Long templateId,
    EmailTemplateRequest template,
    Map<String, String> variables

) {}
