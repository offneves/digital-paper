package com.digitalpaper.auth.controller.internal;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.digitalpaper.auth.entity.enums.UserRole;
import com.digitalpaper.auth.exception.BusinessException;
import com.digitalpaper.auth.exception.enums.ErrorCode;
import com.digitalpaper.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/internal/user")
@RequiredArgsConstructor
public class InternalUserController {

    private final UserRepository userRepository;

    @Value("${app.internal-api-key:}")
    private String internalApiKey;

    @GetMapping("/ids")
    public ResponseEntity<List<Long>> listIdsByRole(
        @RequestHeader(value = "X-Internal-Key", required = false) String providedKey,
        @RequestParam String role
    ) {
        if (internalApiKey == null || internalApiKey.isBlank()
            || providedKey == null || !internalApiKey.equals(providedKey)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        UserRole userRole;
        try {
            userRole = UserRole.valueOf(role.trim().toUpperCase());
        } catch (IllegalArgumentException | NullPointerException ex) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }

        return ResponseEntity.ok(userRepository.findIdsByRoleAndActiveTrue(userRole));
    }

}
