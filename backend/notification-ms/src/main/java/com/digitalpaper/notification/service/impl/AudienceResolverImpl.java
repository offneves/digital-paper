package com.digitalpaper.notification.service.impl;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import org.springframework.stereotype.Service;
import com.digitalpaper.notification.client.AuthUserClient;
import com.digitalpaper.notification.entity.enums.AnnouncementAudience;
import com.digitalpaper.notification.exception.BusinessException;
import com.digitalpaper.notification.exception.enums.ErrorCode;
import com.digitalpaper.notification.service.AudienceResolver;
import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class AudienceResolverImpl implements AudienceResolver {

    private final AuthUserClient authUserClient;

    @Override
    public List<Long> resolve(AnnouncementAudience audience, String audienceRef, List<Long> recipientUserIds) {
        if (audience == AnnouncementAudience.BY_USER_IDS) {
            return distinct(recipientUserIds);
        }

        if (recipientUserIds != null && !recipientUserIds.isEmpty()) {
            return distinct(recipientUserIds);
        }

        return switch (audience) {
            case ALL_ADMIN ->                    authUserClient.listUserIdsByRole("ADMIN");
            case ALL_COMMON ->                   authUserClient.listUserIdsByRole("COMMON_USER");
            case ALL_PUBLIC_SERVANT ->           authUserClient.listUserIdsByRole("PUBLIC_SERVANT");
            case ALL_ENTERPRISE ->               authUserClient.listUserIdsByRole("ENTERPRISE_USER");
            case ALL_USERS ->                    mergeRoles("ADMIN","COMMON_USER","PUBLIC_SERVANT","ENTERPRISE_USER");
            case BY_DEPARTMENT, BY_ENTERPRISE -> {
                if (audienceRef == null || audienceRef.isBlank()) {
                    throw new BusinessException(ErrorCode.ANNOUNCEMENT_AUDIENCE_UNSUPPORTED);
                }
                throw new BusinessException(ErrorCode.ANNOUNCEMENT_AUDIENCE_UNSUPPORTED);
            }
            case BY_USER_IDS -> List.of();
        };
    }

    private List<Long> mergeRoles(String... roles) {
        LinkedHashSet<Long> ids = new LinkedHashSet<>();
        for (String role : roles) {
            ids.addAll(authUserClient.listUserIdsByRole(role));
        }
        return new ArrayList<>(ids);
    }

    private List<Long> distinct(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return new ArrayList<>(new LinkedHashSet<>(ids));
    }

}
