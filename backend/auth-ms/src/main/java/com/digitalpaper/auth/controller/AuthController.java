package com.digitalpaper.auth.controller;

import java.time.LocalDateTime;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import com.digitalpaper.auth.service.EmailVerificationService;
import com.digitalpaper.auth.service.PasswordResetService;
import com.digitalpaper.auth.service.UserService;
import com.digitalpaper.auth.service.impl.TokenService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.digitalpaper.auth.config.RabbitMQConfig;
import com.digitalpaper.auth.dto.request.ForgotPasswordRequest;
import com.digitalpaper.auth.dto.request.LoginRequest;
import com.digitalpaper.auth.dto.request.RegisterRequest;
import com.digitalpaper.auth.dto.request.ResendVerificationRequest;
import com.digitalpaper.auth.dto.request.ResetPasswordRequest;
import com.digitalpaper.auth.dto.request.VerifyEmailRequest;
import com.digitalpaper.auth.dto.response.TokenResponse;
import com.digitalpaper.auth.exception.enums.ErrorCode;
import com.digitalpaper.auth.dto.event.LoginEvent;
import com.digitalpaper.auth.entity.User;
import com.digitalpaper.auth.exception.BusinessException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;
    private final RabbitTemplate rabbitTemplate;
    private final UserService userService;
    private final PasswordResetService passwordResetService;
    private final EmailVerificationService emailVerificationService;


    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid LoginRequest loginRequest) {
        try {
            var authToken = new UsernamePasswordAuthenticationToken(loginRequest.login(), loginRequest.password());
            var authentication = authenticationManager.authenticate(authToken);

            User loginUser = (User) authentication.getPrincipal();

            if (loginUser.getEmailVerifiedAt() == null) {
                throw new BusinessException(ErrorCode.AUTH_EMAIL_NOT_VERIFIED);
            }

            userService.touchLastLogin(loginUser);

            String jwt = tokenService.generateToken(loginUser);

            LoginEvent successEvent = new LoginEvent(loginUser.getLogin(), "SUCCESS", LocalDateTime.now());
            rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE_NAME,
                RabbitMQConfig.ROUTING_KEY_SUCCESS,
                successEvent
            );

            return ResponseEntity.ok(new TokenResponse(jwt));
        } catch (AuthenticationException e) {
            LoginEvent failedEvent = new LoginEvent(loginRequest.login(), "FAILED", LocalDateTime.now());
            rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE_NAME,
                RabbitMQConfig.ROUTING_KEY_FAILED,
                failedEvent
            );

            throw new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody @Valid RegisterRequest registerRequest) {
        userService.userRegistry(registerRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body("User registry succesfull.");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@RequestBody @Valid ForgotPasswordRequest request) {
        passwordResetService.requestReset(request);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@RequestBody @Valid ResetPasswordRequest request) {
        passwordResetService.resetPassword(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/verify-email")
    public ResponseEntity<Void> verifyEmail(@RequestBody @Valid VerifyEmailRequest request) {
        emailVerificationService.verify(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Void> resendVerification(@RequestBody @Valid ResendVerificationRequest request) {
        emailVerificationService.resend(request);
        return ResponseEntity.accepted().build();
    }

}
