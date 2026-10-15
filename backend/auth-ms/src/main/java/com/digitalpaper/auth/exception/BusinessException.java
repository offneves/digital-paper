package com.digitalpaper.auth.exception;

import com.digitalpaper.auth.dto.enums.ErrorCode;
import lombok.Getter;


@Getter
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

}
