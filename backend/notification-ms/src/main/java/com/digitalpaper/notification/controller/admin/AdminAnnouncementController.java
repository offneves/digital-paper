package com.digitalpaper.notification.controller.admin;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.digitalpaper.notification.dto.request.CreateAnnouncementRequest;
import com.digitalpaper.notification.dto.response.AnnouncementResponse;
import com.digitalpaper.notification.dto.response.PageResponse;
import com.digitalpaper.notification.security.SecurityUtils;
import com.digitalpaper.notification.service.AnnouncementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/admin/announcement")
@RequiredArgsConstructor
public class AdminAnnouncementController {

    private final AnnouncementService announcementService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AnnouncementResponse> create(
        @RequestBody @Valid CreateAnnouncementRequest request
    ) {
        Long createdBy = SecurityUtils.currentUser().id();
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(announcementService.create(createdBy, request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PageResponse<AnnouncementResponse>> list(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(announcementService.list(page, size));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AnnouncementResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(announcementService.get(id));
    }

}
