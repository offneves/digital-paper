package com.digitalpaper.email.dto.response;

import java.util.List;


public record EmailDetailResponse(

    EmailResponse email,
    String body,
    List<EmailAttemptResponse> attempts

) {}
