package com.digitalpaper.auth_ms.dto.enums;

import org.springframework.http.HttpStatus;
import lombok.Getter;
import lombok.RequiredArgsConstructor;


@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    AUTH_INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "Wrong login or password."),
    AUTH_USER_NOT_FOUND(HttpStatus.NOT_FOUND, "User not found."),
    AUTH_LOGIN_ALREADY_IN_USE(HttpStatus.CONFLICT, "This login is already in use."),
    AUTH_REGISTRY_INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error to process registry."),

    PROFILE_NOT_FOUND(HttpStatus.NOT_FOUND, "Profile not found."),
    PROFILE_NAME_EXISTS(HttpStatus.CONFLICT, "Profile name already exists."),
    PROFILE_HAS_LINKED_USERS(HttpStatus.CONFLICT, "Profile cannot be deleted because it is linked to users."),
    PROFILE_USER_EXISTS(HttpStatus.CONFLICT, "User is already linked to this profile."),

    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "User not found."),
    USER_ADMIN_ROLE_FORBIDDEN(HttpStatus.BAD_REQUEST, "Assigning ADMIN role is not allowed."),
    USER_INVALID_DOCUMENT(HttpStatus.BAD_REQUEST, "Document does not match the selected role."),

    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "Validation failed."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected internal error.");

    private final HttpStatus status;
    private final String message;
}
