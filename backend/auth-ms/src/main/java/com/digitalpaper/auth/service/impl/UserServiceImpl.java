package com.digitalpaper.auth.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.digitalpaper.auth.config.RabbitMQConfig;
import com.digitalpaper.auth.exception.enums.ErrorCode;
import com.digitalpaper.auth.dto.event.UserCreateEvent;
import com.digitalpaper.auth.dto.request.AdminUserUpdateRequest;
import com.digitalpaper.auth.dto.request.RegisterRequest;
import com.digitalpaper.auth.dto.response.AdminUserResponse;
import com.digitalpaper.auth.dto.response.PageResponse;
import com.digitalpaper.auth.dto.response.UserProfileSummaryResponse;
import com.digitalpaper.auth.entity.User;
import com.digitalpaper.auth.entity.UserProfile;
import com.digitalpaper.auth.entity.enums.UserRole;
import com.digitalpaper.auth.exception.BusinessException;
import com.digitalpaper.auth.repository.UserRepository;
import com.digitalpaper.auth.service.EmailVerificationService;
import com.digitalpaper.auth.service.UserProfileService;
import com.digitalpaper.auth.service.UserService;
import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserProfileService userProfileService;
    private final PasswordEncoder passwordEncoder;
    private final RabbitTemplate rabbitTemplate;
    private final EmailVerificationService emailVerificationService;

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
            newUser.getCpfCnpj(),
            newUser.getRole().name()
        );

        rabbitTemplate.convertAndSend(
            RabbitMQConfig.EXCHANGE_NAME,
            RabbitMQConfig.ROUTING_KEY_CREATED,
            event
        );

        emailVerificationService.sendVerification(newUser);
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

        if (request.profileIds() != null) {
            userProfileService.replaceProfiles(user, request.profileIds(), resolveCurrentAssigner());
        } else {
            userProfileService.syncDefaultProfileOnRoleChange(user, previousRole, nextRole);
        }

        return toResponse(userRepository.save(user));
    }

    private User resolveCurrentAssigner() {
        Object principal = SecurityContextHolder.getContext().getAuthentication() != null
            ? SecurityContextHolder.getContext().getAuthentication().getPrincipal()
            : null;

        String login = null;
        if (principal instanceof UserDetails details) {
            login = details.getUsername();
        } else if (principal instanceof String value) {
            login = value;
        }

        if (login == null || login.isBlank()) {
            return null;
        }

        UserDetails found = userRepository.findByLogin(login);
        return found instanceof User user ? user : null;
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
            .emailVerifiedAt(user.getEmailVerifiedAt())
            .profiles(profiles)
            .build();
    }

}
