package com.digitalpaper.notification.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.digitalpaper.notification.exception.BusinessException;
import com.digitalpaper.notification.exception.enums.ErrorCode;


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
