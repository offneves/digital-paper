package com.digitalpaper.email.dto.response;

import java.util.List;
import java.util.Map;


public record EmailTemplatePreviewResponse(

    String subject,
    String html,
    List<String> variables,
    Map<String, String> sampleValues

) {}
