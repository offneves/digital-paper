package com.digitalpaper.notification.exception.enums;

import org.springframework.http.HttpStatus;
import lombok.Getter;
import lombok.RequiredArgsConstructor;


@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    NOTIFICATION_NOT_FOUND(HttpStatus.NOT_FOUND, "Notification not found."),
    ANNOUNCEMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "Announcement not found."),
    ANNOUNCEMENT_NO_RECIPIENTS(HttpStatus.BAD_REQUEST, "No recipients resolved for this announcement."),
    ANNOUNCEMENT_AUDIENCE_UNSUPPORTED(HttpStatus.BAD_REQUEST, "Audience requires recipientUserIds or is not supported yet."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "You do not have permission for this action."),
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "Validation failed."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected internal error.");

    private final HttpStatus status;
    private final String message;

}
