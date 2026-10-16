package com.digitalpaper.auth.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import com.digitalpaper.auth.exception.enums.ErrorCode;
import com.digitalpaper.auth.dto.error.ApiErrorResponse;


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
