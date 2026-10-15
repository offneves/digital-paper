package com.digitalpaper.auth.dto.response;

import lombok.Builder;


@Builder
public record ProfileResponse(

    Long id,
    String profileName,
    Boolean active

) {}
