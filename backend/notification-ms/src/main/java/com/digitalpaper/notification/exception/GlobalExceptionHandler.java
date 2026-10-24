package com.digitalpaper.notification.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import com.digitalpaper.notification.dto.error.ApiErrorResponse;
import com.digitalpaper.notification.exception.enums.ErrorCode;


@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiErrorResponse> handleBusiness(BusinessException ex) {
        ErrorCode code = ex.getErrorCode();
        return ResponseEntity
            .status(code.getStatus())
            .body(new ApiErrorResponse(code.name(), code.getMessage()));
    }

}
