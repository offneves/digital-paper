package com.digitalpaper.auth_ms.exception;

import com.digitalpaper.auth_ms.dto.enums.ErrorCode;
import lombok.Getter;


@Getter
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

}
