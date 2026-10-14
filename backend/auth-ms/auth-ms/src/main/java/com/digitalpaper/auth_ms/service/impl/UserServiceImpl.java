package com.digitalpaper.auth_ms.service.impl;

import java.time.LocalDateTime;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.digitalpaper.auth_ms.config.RabbitMQConfig;
import com.digitalpaper.auth_ms.dto.request.RegisterRequest;
import com.digitalpaper.auth_ms.dto.enums.ErrorCode;
import com.digitalpaper.auth_ms.dto.event.UserCreateEvent;
import com.digitalpaper.auth_ms.entity.User;
import com.digitalpaper.auth_ms.exception.BusinessException;
import com.digitalpaper.auth_ms.repository.UserRepository;
import com.digitalpaper.auth_ms.service.UserProfileService;
import com.digitalpaper.auth_ms.service.UserService;
import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserProfileService userProfileService;
    private final PasswordEncoder passwordEncoder;
    private final RabbitTemplate rabbitTemplate;

    @Transactional
    public void userRegistry(RegisterRequest registerRequest) {
        if (userRepository.findByLogin(registerRequest.login()) != null) {
            throw new BusinessException(ErrorCode.AUTH_LOGIN_ALREADY_IN_USE);
        }

        User newUser = new User();
        newUser.setLogin(registerRequest.login());
        newUser.setPassword(passwordEncoder.encode(registerRequest.password()));
        newUser.setEmail(registerRequest.email());
        newUser.setName(registerRequest.name());
        newUser.setCpfCnpj(registerRequest.cpfCnpj());
        newUser.setRole(registerRequest.userRole());
        newUser.setCreatedAt(LocalDateTime.now());

        userRepository.save(newUser);

        userProfileService.assignDefaultProfile(newUser);

        UserCreateEvent event = new UserCreateEvent(
            newUser.getId(),
            newUser.getLogin(),
            newUser.getEmail(),
            newUser.getName(),
            newUser.getCpfCnpj()
        );

        rabbitTemplate.convertAndSend(
            RabbitMQConfig.EXCHANGE_NAME,
            RabbitMQConfig.ROUTING_KEY_CREATED,
            event
        );
    }

}
