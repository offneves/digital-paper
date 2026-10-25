package com.digitalpaper.email.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.digitalpaper.email.exception.BusinessException;
import com.digitalpaper.email.exception.enums.ErrorCode;


public final class SecurityUtils {

    private SecurityUtils() {}

    public static AuthPrincipal currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthPrincipal principal)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        if (principal.id() == null) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        return principal;
    }

}
