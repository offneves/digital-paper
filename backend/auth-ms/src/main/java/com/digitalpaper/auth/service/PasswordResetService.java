package com.digitalpaper.auth.service;

import com.digitalpaper.auth.dto.request.ForgotPasswordRequest;
import com.digitalpaper.auth.dto.request.ResetPasswordRequest;


public interface PasswordResetService {

    void requestReset(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);

}
