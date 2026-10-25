package com.digitalpaper.email.service;

import java.util.List;
import com.digitalpaper.email.dto.request.EmailTemplatePreviewRequest;
import com.digitalpaper.email.dto.request.EmailTemplateRequest;
import com.digitalpaper.email.dto.request.EmailTemplateTestRequest;
import com.digitalpaper.email.dto.response.EmailResponse;
import com.digitalpaper.email.dto.response.EmailTemplatePreviewResponse;
import com.digitalpaper.email.dto.response.EmailTemplateResponse;


public interface EmailTemplateService {

    List<EmailTemplateResponse> list();

    EmailTemplateResponse get(Long id);

    EmailTemplateResponse create(EmailTemplateRequest request, Long adminId);

    EmailTemplateResponse update(Long id, EmailTemplateRequest request, Long adminId);

    EmailTemplateResponse setEnabled(Long id, boolean enabled, Long adminId);

    EmailTemplateResponse restoreDefault(Long id, Long adminId);

    void delete(Long id);

    EmailTemplatePreviewResponse preview(EmailTemplatePreviewRequest request);

    EmailResponse sendTest(Long id, EmailTemplateTestRequest request);

}
