package com.digitalpaper.notification.service;

import java.util.List;
import com.digitalpaper.notification.entity.enums.AnnouncementAudience;


public interface AudienceResolver {

    List<Long> resolve(AnnouncementAudience audience, String audienceRef, List<Long> recipientUserIds);

}
