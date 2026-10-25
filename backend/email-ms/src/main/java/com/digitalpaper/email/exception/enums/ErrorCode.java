package com.digitalpaper.email.exception.enums;

import org.springframework.http.HttpStatus;
import lombok.Getter;
import lombok.RequiredArgsConstructor;


@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    EMAIL_NOT_FOUND(HttpStatus.NOT_FOUND, "E-mail not found."),
    EMAIL_ALREADY_SENT(HttpStatus.CONFLICT, "E-mail was already sent."),
    EMAIL_CONTENT_UNAVAILABLE(HttpStatus.CONFLICT, "E-mail content is no longer available to resend."),
    TEMPLATE_NOT_FOUND(HttpStatus.NOT_FOUND, "E-mail template not found."),
    TEMPLATE_KEY_INVALID(HttpStatus.BAD_REQUEST, "Template key must contain only lowercase letters, numbers and hyphens."),
    TEMPLATE_KEY_EXISTS(HttpStatus.CONFLICT, "A template with this key already exists."),
    TEMPLATE_SYSTEM_PROTECTED(HttpStatus.CONFLICT, "System templates cannot be deleted."),
    TEMPLATE_NO_DEFAULT(HttpStatus.BAD_REQUEST, "Only system templates can be restored to default."),
    TEMPLATE_BUTTON_INVALID(HttpStatus.BAD_REQUEST, "Button needs both a label and an http(s) URL or variable."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "You do not have permission for this action."),
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "Validation failed."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected internal error.");

    private final HttpStatus status;
    private final String message;

}
