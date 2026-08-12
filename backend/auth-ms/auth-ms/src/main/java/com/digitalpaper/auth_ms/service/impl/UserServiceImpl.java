package com.digitalpaper.auth_ms.service.impl;

import java.time.LocalDateTime;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.digitalpaper.auth_ms.config.RabbitMQConfig;
import com.digitalpaper.auth_ms.dto.RegisterRequest;
import com.digitalpaper.auth_ms.dto.event.UserCreateEvent;
import com.digitalpaper.auth_ms.entity.User;
import com.digitalpaper.auth_ms.repository.UserRepository;
import com.digitalpaper.auth_ms.service.UserService;


@Service
public class UserServiceImpl implements UserService {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private RabbitTemplate rabbitTemplate;

    public UserServiceImpl(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        RabbitTemplate rabbitTemplate
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.rabbitTemplate = rabbitTemplate;
    }

    @Transactional
    public void userRegistry(RegisterRequest registerRequest) {
        if (userRepository.findByLogin(registerRequest.login()) != null) {
            throw new IllegalArgumentException("This login is already in use.");
        }

        User newUser = new User();
        newUser.setLogin(registerRequest.login());
        newUser.setPassword(passwordEncoder.encode(registerRequest.password()));
        newUser.setName(registerRequest.name());
        newUser.setCpf(registerRequest.cpf());
        newUser.setRole(registerRequest.userRole());
        newUser.setCreatedAt(LocalDateTime.now());

        userRepository.save(newUser);

        UserCreateEvent event = new UserCreateEvent(
            newUser.getId(),
            newUser.getLogin(),
            newUser.getName(),
            newUser.getCpf()
        );

        rabbitTemplate.convertAndSend(
            RabbitMQConfig.EXCHANGE_NAME,
            RabbitMQConfig.ROUTING_KEY_CREATED,
            event
        );
    }

}
