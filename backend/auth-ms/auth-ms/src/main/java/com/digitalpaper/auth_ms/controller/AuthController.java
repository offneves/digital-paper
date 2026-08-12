package com.digitalpaper.auth_ms.controller;

import java.time.LocalDateTime;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import com.digitalpaper.auth_ms.service.UserService;
import com.digitalpaper.auth_ms.service.impl.TokenService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.digitalpaper.auth_ms.config.RabbitMQConfig;
import com.digitalpaper.auth_ms.dto.LoginRequest;
import com.digitalpaper.auth_ms.dto.RegisterRequest;
import com.digitalpaper.auth_ms.dto.TokenResponse;
import com.digitalpaper.auth_ms.dto.event.LoginEvent;
import com.digitalpaper.auth_ms.entity.User;
import jakarta.validation.Valid;


@RestController
@RequestMapping("/auth")
public class AuthController {

    private AuthenticationManager authenticationManager;
    private TokenService tokenService;
    private RabbitTemplate rabbitTemplate;
    private UserService userService;

    public AuthController(
        AuthenticationManager authenticationManager,
        TokenService tokenService,
        RabbitTemplate rabbitTemplate,
        UserService userService

    ) {
        this.authenticationManager = authenticationManager;
        this.tokenService = tokenService;
        this.rabbitTemplate = rabbitTemplate;
        this.userService = userService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid LoginRequest loginRequest) {
        try {
            var authToken = new UsernamePasswordAuthenticationToken(loginRequest.login(), loginRequest.password());
            var authentication = authenticationManager.authenticate(authToken);

            User loginUser = (User) authentication.getPrincipal();
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

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Wrong login or password.");
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody @Valid RegisterRequest registerRequest) {
        try {
            userService.userRegistry(registerRequest);
            return ResponseEntity.status(HttpStatus.CREATED).body("User registry succesfull.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error to process registry.");
        }
    }

}
