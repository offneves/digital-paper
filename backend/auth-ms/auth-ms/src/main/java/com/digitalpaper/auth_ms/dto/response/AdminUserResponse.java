package com.digitalpaper.auth_ms.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import com.digitalpaper.auth_ms.entity.enums.UserRole;
import lombok.Builder;


@Builder
public record AdminUserResponse(

    Long id,
    String login,
    String name,
    String email,
    String cpfCnpj,
    UserRole role,
    Boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    LocalDateTime lastLoginAt,
    List<UserProfileSummaryResponse> profiles

) {}
