package com.digitalpaper.email.service;

import java.util.Map;
import com.digitalpaper.email.composer.EmailMessage;
import com.digitalpaper.email.dto.response.EmailDetailResponse;
import com.digitalpaper.email.dto.response.EmailResponse;
import com.digitalpaper.email.dto.response.PageResponse;
import com.digitalpaper.email.entity.EmailTemplate;
import com.digitalpaper.email.entity.enums.EmailStatus;


public interface EmailService {

    void dispatch(EmailMessage message);

    EmailResponse sendTest(EmailTemplate template, String to, Map<String, String> variables);

    int retryDue();

    PageResponse<EmailResponse> list(String q, EmailStatus status, String templateKey, int page, int size);

    EmailDetailResponse get(Long id);

    EmailDetailResponse resend(Long id);

}
