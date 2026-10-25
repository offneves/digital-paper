package com.digitalpaper.email.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import com.digitalpaper.email.dto.error.ApiErrorResponse;
import com.digitalpaper.email.exception.enums.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;


@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiErrorResponse> handleBusiness(BusinessException ex, HttpServletRequest request) {
        ErrorCode code = ex.getErrorCode();
        log.warn("{} {} -> {} {}", request.getMethod(), request.getRequestURI(), code.getStatus().value(), code.name());
        return build(code.getStatus(), code.name(), code.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .findFirst()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .orElse(ErrorCode.VALIDATION_ERROR.getMessage());

        log.warn("{} {} -> 400 {} ({})", request.getMethod(), request.getRequestURI(), ErrorCode.VALIDATION_ERROR.name(), message);
        return build(ErrorCode.VALIDATION_ERROR.getStatus(), ErrorCode.VALIDATION_ERROR.name(), message);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleUnreadable(HttpMessageNotReadableException ex, HttpServletRequest request) {
        ErrorCode code = ErrorCode.VALIDATION_ERROR;
        log.warn("{} {} -> 400 {} (malformed request body)", request.getMethod(), request.getRequestURI(), code.name());
        return build(code.getStatus(), code.name(), code.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        ErrorCode code = ErrorCode.FORBIDDEN;
        log.warn("{} {} -> 403 {}", request.getMethod(), request.getRequestURI(), code.name());
        return build(code.getStatus(), code.name(), code.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception ex, HttpServletRequest request) {
        if (ex instanceof ErrorResponse errorResponse) {
            HttpStatusCode status = errorResponse.getStatusCode();
            HttpStatus resolved = HttpStatus.resolve(status.value());
            String code = status.value() == 400
                ? ErrorCode.VALIDATION_ERROR.name()
                : resolved != null ? resolved.name() : String.valueOf(status.value());
            String message = errorResponse.getBody().getDetail() != null
                ? errorResponse.getBody().getDetail()
                : code;

            log.warn("{} {} -> {} {}", request.getMethod(), request.getRequestURI(), status.value(), code);
            return build(status, code, message);
        }

        ErrorCode code = ErrorCode.INTERNAL_ERROR;
        log.error("{} {} -> 500 {}", request.getMethod(), request.getRequestURI(), code.name(), ex);
        return build(code.getStatus(), code.name(), code.getMessage());
    }

    private static ResponseEntity<ApiErrorResponse> build(HttpStatusCode status, String code, String message) {
        return ResponseEntity.status(status).body(new ApiErrorResponse(code, message));
    }

}
