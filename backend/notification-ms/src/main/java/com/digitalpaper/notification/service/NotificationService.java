package com.digitalpaper.notification.service;

import java.util.List;
import com.digitalpaper.notification.dto.response.NotificationResponse;
import com.digitalpaper.notification.dto.response.PageResponse;
import com.digitalpaper.notification.entity.Announcement;
import com.digitalpaper.notification.entity.enums.NotificationType;


public interface NotificationService {

    PageResponse<NotificationResponse> list(
        Long recipientUserId,
        String status,
        Integer page,
        Integer size
    );

    Long unreadCount(Long recipientUserId);

    NotificationResponse markRead(Long recipientUserId, Long notificationId);

    NotificationResponse markUnread(Long recipientUserId, Long notificationId);

    Integer markAllRead(Long recipientUserId);

    void delete(Long recipientUserId, Long notificationId);

    NotificationResponse restore(Long recipientUserId, Long notificationId);

    void createForUsers(
        List<Long> recipientUserIds,
        NotificationType type,
        String title,
        String body,
        String link,
        String source,
        Announcement announcement
    );

}
