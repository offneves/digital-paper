package com.digitalpaper.auth_ms.dto.response;

import com.digitalpaper.auth_ms.entity.enums.UserProfileStatus;


public record UserProfileSummaryResponse(

    Long id,
    String profileName,
    UserProfileStatus status

) {}
