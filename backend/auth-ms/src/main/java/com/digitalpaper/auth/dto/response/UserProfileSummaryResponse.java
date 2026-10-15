package com.digitalpaper.auth.dto.response;

import com.digitalpaper.auth.entity.enums.UserProfileStatus;


public record UserProfileSummaryResponse(

    Long id,
    String profileName,
    UserProfileStatus status

) {}
