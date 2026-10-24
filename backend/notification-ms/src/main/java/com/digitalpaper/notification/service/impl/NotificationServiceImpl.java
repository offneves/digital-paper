package com.digitalpaper.notification.service.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.digitalpaper.notification.dto.response.NotificationResponse;
import com.digitalpaper.notification.dto.response.PageResponse;
import com.digitalpaper.notification.entity.Announcement;
import com.digitalpaper.notification.entity.Notification;
import com.digitalpaper.notification.entity.enums.NotificationType;
import com.digitalpaper.notification.exception.BusinessException;
import com.digitalpaper.notification.exception.enums.ErrorCode;
import com.digitalpaper.notification.repository.NotificationRepository;
import com.digitalpaper.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> list(
        Long recipientUserId,
        String status,
        Integer page,
        Integer size
    ) {
        var pageable = PageRequest.of(
            Math.max(page == null ? 0 : page, 0),
            sanitizeSize(size == null ? 20 : size),
            Sort.by(Sort.Direction.DESC, "createdAt")
        );

        String normalized = status == null ? "all" : status.trim().toLowerCase();

        Page<Notification> result = switch (normalized) {
            case "unread" -> notificationRepository
                .findUnreadByRecipient(recipientUserId, pageable);
            case "read" -> notificationRepository
                .findReadByRecipient(recipientUserId, pageable);
            case "deleted" -> notificationRepository
                .findDeletedByRecipient(recipientUserId, pageable);
            default -> notificationRepository
                .findActiveByRecipient(recipientUserId, pageable);
        };

        return PageResponse.<NotificationResponse>builder()
            .content(result.getContent().stream().map(this::toResponse).toList())
            .page(result.getNumber())
            .size(result.getSize())
            .totalElements(result.getTotalElements())
            .totalPages(result.getTotalPages())
            .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Long unreadCount(Long recipientUserId) {
        return notificationRepository.countUnreadByRecipient(recipientUserId);
    }

    @Override
    @Transactional
    public NotificationResponse markRead(Long recipientUserId, Long notificationId) {
        Notification notification = requireOwnedActive(recipientUserId, notificationId);

        if (notification.getReadAt() == null) {
            notification.setReadAt(LocalDateTime.now());
            notification = notificationRepository.saveAndFlush(notification);
        }

        return toResponse(notification);
    }

    @Override
    @Transactional
    public NotificationResponse markUnread(Long recipientUserId, Long notificationId) {
        Notification notification = requireOwnedActive(recipientUserId, notificationId);

        if (notification.getReadAt() != null) {
            notification.setReadAt(null);
            notification = notificationRepository.saveAndFlush(notification);
        }

        return toResponse(notification);
    }

    @Override
    @Transactional
    public Integer markAllRead(Long recipientUserId) {
        return notificationRepository.markAllRead(recipientUserId, LocalDateTime.now());
    }

    @Override
    @Transactional
    public void delete(Long recipientUserId, Long notificationId) {
        Notification notification = requireOwned(recipientUserId, notificationId);
        if (notification.getDeletedAt() != null) {
            return;
        }
        notification.setDeletedAt(LocalDateTime.now());
        notificationRepository.saveAndFlush(notification);
    }

    @Override
    @Transactional
    public NotificationResponse restore(Long recipientUserId, Long notificationId) {
        Notification notification = requireOwned(recipientUserId, notificationId);
        if (notification.getDeletedAt() == null) {
            throw new BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND);
        }
        notification.setDeletedAt(null);
        notification = notificationRepository.saveAndFlush(notification);
        return toResponse(notification);
    }

    @Override
    @Transactional
    public void createForUsers(
        List<Long> recipientUserIds,
        NotificationType type,
        String title,
        String body,
        String link,
        String source,
        Announcement announcement
    ) {
        if (recipientUserIds == null || recipientUserIds.isEmpty()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        List<Notification> batch = new ArrayList<>(recipientUserIds.size());

        for (Long recipientUserId : recipientUserIds) {
            batch.add(Notification.builder()
                .recipientUserId(recipientUserId)
                .announcement(announcement)
                .type(type)
                .title(title)
                .body(body)
                .link(link)
                .source(source)
                .createdAt(now)
                .build());
        }

        notificationRepository.saveAll(batch);
    }

    private Notification requireOwnedActive(Long recipientUserId, Long notificationId) {
        Notification notification = requireOwned(recipientUserId, notificationId);
        if (notification.getDeletedAt() != null) {
            throw new BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND);
        }
        return notification;
    }

    private Notification requireOwned(Long recipientUserId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND));

        if (!notification.getRecipientUserId().equals(recipientUserId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        return notification;
    }

    private int sanitizeSize(int size) {
        return switch (size) {
            case 5, 10, 25, 50 -> size;
            default -> 20;
        };
    }

    private NotificationResponse toResponse(Notification notification) {
        Long announcementId = notification.getAnnouncement() == null
            ? null
            : notification.getAnnouncement().getId();

        boolean isRead = notification.getReadAt() != null;
        boolean isDeleted = notification.getDeletedAt() != null;

        return NotificationResponse.builder()
            .id(notification.getId())
            .recipientUserId(notification.getRecipientUserId())
            .announcementId(announcementId)
            .type(notification.getType())
            .title(notification.getTitle())
            .body(notification.getBody())
            .link(notification.getLink())
            .source(notification.getSource())
            .readAt(notification.getReadAt())
            .deletedAt(notification.getDeletedAt())
            .createdAt(notification.getCreatedAt())
            .read(isRead)
            .deleted(isDeleted)
            .build();
    }

}
