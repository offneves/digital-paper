package com.digitalpaper.auth.service;

import com.digitalpaper.auth.dto.request.ResendVerificationRequest;
import com.digitalpaper.auth.dto.request.VerifyEmailRequest;
import com.digitalpaper.auth.entity.User;


public interface EmailVerificationService {

    void sendVerification(User user);
    void verify(VerifyEmailRequest request);
    void resend(ResendVerificationRequest request);

}
