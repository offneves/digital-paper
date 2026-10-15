package com.digitalpaper.auth_ms.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.digitalpaper.auth_ms.config.RabbitMQConfig;
import com.digitalpaper.auth_ms.dto.enums.ErrorCode;
import com.digitalpaper.auth_ms.dto.event.UserCreateEvent;
import com.digitalpaper.auth_ms.dto.request.AdminUserUpdateRequest;
import com.digitalpaper.auth_ms.dto.request.RegisterRequest;
import com.digitalpaper.auth_ms.dto.response.AdminUserResponse;
import com.digitalpaper.auth_ms.dto.response.PageResponse;
import com.digitalpaper.auth_ms.dto.response.UserProfileSummaryResponse;
import com.digitalpaper.auth_ms.entity.User;
import com.digitalpaper.auth_ms.entity.UserProfile;
import com.digitalpaper.auth_ms.entity.enums.UserRole;
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

    @Override
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
        newUser.setActive(true);
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

    @Override
    @Transactional
    public void touchLastLogin(User user) {
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminUserResponse> listUsers(String q, UserRole role, int page, int size) {
        String query = q == null ? "" : q.trim();
        Pageable pageable = buildUserPageable(page, size);
        Page<User> result = userRepository.search(query, role, pageable);

        List<AdminUserResponse> content = result.getContent().stream()
            .map(this::toResponse)
            .toList();

        return PageResponse.<AdminUserResponse>builder()
            .content(content)
            .page(result.getNumber())
            .size(result.getSize())
            .totalElements(result.getTotalElements())
            .totalPages(result.getTotalPages())
            .build();
    }

    private Pageable buildUserPageable(int page, int size) {
        int safeSize = switch (size) {
            case 5, 10, 25, 50 -> size;
            default -> 50;
        };

        return PageRequest.of(
            Math.max(page, 0),
            safeSize,
            Sort.by(Sort.Direction.ASC, "name")
        );
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserResponse getUser(Long id) {
        return toResponse(findUserOrThrow(id));
    }

    @Override
    @Transactional
    public AdminUserResponse updateUser(Long id, AdminUserUpdateRequest request) {
        User user = findUserOrThrow(id);
        UserRole previousRole = user.getRole();
        UserRole nextRole = request.role();

        if (nextRole == UserRole.ADMIN && previousRole != UserRole.ADMIN) {
            throw new BusinessException(ErrorCode.USER_ADMIN_ROLE_FORBIDDEN);
        }

        if (previousRole == UserRole.ADMIN && nextRole != UserRole.ADMIN) {
            throw new BusinessException(ErrorCode.USER_ADMIN_ROLE_FORBIDDEN);
        }

        validateDocumentForRole(request.cpfCnpj(), nextRole);

        user.setName(request.name().trim());
        user.setEmail(request.email().trim());
        user.setCpfCnpj(request.cpfCnpj().trim());
        user.setRole(nextRole);
        user.setActive(request.active());
        user.setUpdatedAt(LocalDateTime.now());

        userProfileService.syncDefaultProfileOnRoleChange(user, previousRole, nextRole);

        return toResponse(userRepository.save(user));
    }

    private User findUserOrThrow(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    private void validateDocumentForRole(String cpfCnpj, UserRole role) {
        String digits = cpfCnpj == null ? "" : cpfCnpj.replaceAll("\\D", "");

        boolean valid = switch (role) {
            case COMMON_USER, PUBLIC_SERVANT -> digits.length() == 11;
            case ENTERPRISE_USER -> digits.length() == 14;
            case ADMIN -> digits.length() == 11 || digits.length() == 14;
        };

        if (!valid) {
            throw new BusinessException(ErrorCode.USER_INVALID_DOCUMENT);
        }
    }

    private AdminUserResponse toResponse(User user) {
        List<UserProfile> links = userProfileService.listByUserId(user.getId());

        List<UserProfileSummaryResponse> profiles = links.stream()
            .map(link -> new UserProfileSummaryResponse(
                link.getProfile().getId(),
                link.getProfile().getProfileName(),
                link.getStatus()
            ))
            .toList();

        return AdminUserResponse.builder()
            .id(user.getId())
            .login(user.getLogin())
            .name(user.getName())
            .email(user.getEmail())
            .cpfCnpj(user.getCpfCnpj())
            .role(user.getRole())
            .active(Boolean.TRUE.equals(user.getActive()))
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt())
            .lastLoginAt(user.getLastLoginAt())
            .profiles(profiles)
            .build();
    }

}
