package com.digitalpaper.notification.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.digitalpaper.notification.dto.response.MarkAllReadResponse;
import com.digitalpaper.notification.dto.response.NotificationResponse;
import com.digitalpaper.notification.dto.response.PageResponse;
import com.digitalpaper.notification.dto.response.UnreadCountResponse;
import com.digitalpaper.notification.security.SecurityUtils;
import com.digitalpaper.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<PageResponse<NotificationResponse>> list(
        @RequestParam(defaultValue = "all") String status,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Long userId = SecurityUtils.currentUser().id();
        return ResponseEntity.ok(notificationService.list(userId, status, page, size));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponse> unreadCount() {
        Long userId = SecurityUtils.currentUser().id();
        return ResponseEntity.ok(new UnreadCountResponse(notificationService.unreadCount(userId)));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markRead(@PathVariable Long id) {
        Long userId = SecurityUtils.currentUser().id();
        return ResponseEntity.ok(notificationService.markRead(userId, id));
    }

    @PatchMapping("/{id}/unread")
    public ResponseEntity<NotificationResponse> markUnread(@PathVariable Long id) {
        Long userId = SecurityUtils.currentUser().id();
        return ResponseEntity.ok(notificationService.markUnread(userId, id));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<MarkAllReadResponse> markAllRead() {
        Long userId = SecurityUtils.currentUser().id();
        int updated = notificationService.markAllRead(userId);
        return ResponseEntity.ok(new MarkAllReadResponse(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Long userId = SecurityUtils.currentUser().id();
        notificationService.delete(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<NotificationResponse> restore(@PathVariable Long id) {
        Long userId = SecurityUtils.currentUser().id();
        return ResponseEntity.ok(notificationService.restore(userId, id));
    }

}
