package com.digitalpaper.notification.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.digitalpaper.notification.dto.request.CreateAnnouncementRequest;
import com.digitalpaper.notification.dto.response.AnnouncementResponse;
import com.digitalpaper.notification.dto.response.PageResponse;
import com.digitalpaper.notification.entity.Announcement;
import com.digitalpaper.notification.exception.BusinessException;
import com.digitalpaper.notification.exception.enums.ErrorCode;
import com.digitalpaper.notification.repository.AnnouncementRepository;
import com.digitalpaper.notification.service.AnnouncementService;
import com.digitalpaper.notification.service.AudienceResolver;
import com.digitalpaper.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class AnnouncementServiceImpl implements AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final AudienceResolver audienceResolver;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public AnnouncementResponse create(Long createdBy, CreateAnnouncementRequest request) {
        List<Long> recipients = audienceResolver.resolve(request.audience(), request.audienceRef(), request.recipientUserIds());

        if (recipients.isEmpty()) {
            throw new BusinessException(ErrorCode.ANNOUNCEMENT_NO_RECIPIENTS);
        }

        LocalDateTime now = LocalDateTime.now();

        Announcement announcement = Announcement.builder()
            .title(request.title().trim())
            .body(request.body().trim())
            .type(request.type())
            .audience(request.audience())
            .audienceRef(blankToNull(request.audienceRef()))
            .link(blankToNull(request.link()))
            .createdBy(createdBy)
            .publishedAt(now)
            .createdAt(now)
            .build();

        announcement = announcementRepository.save(announcement);

        notificationService.createForUsers(
            recipients,
            request.type(),
            announcement.getTitle(),
            announcement.getBody(),
            announcement.getLink(),
            "admin",
            announcement
        );

        return toResponse(announcement);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AnnouncementResponse> list(int page, int size) {
        var pageable = PageRequest.of(
            Math.max(page, 0),
            size <= 0 ? 20 : Math.min(size, 50),
            Sort.by(Sort.Direction.DESC, "publishedAt")
        );

        Page<Announcement> result = announcementRepository.findAll(pageable);

        return PageResponse.<AnnouncementResponse>builder()
            .content(result.getContent().stream().map(this::toResponse).toList())
            .page(result.getNumber())
            .size(result.getSize())
            .totalElements(result.getTotalElements())
            .totalPages(result.getTotalPages())
            .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AnnouncementResponse get(Long id) {
        return announcementRepository.findById(id)
            .map(this::toResponse)
            .orElseThrow(() -> new BusinessException(ErrorCode.ANNOUNCEMENT_NOT_FOUND));
    }

    private AnnouncementResponse toResponse(Announcement announcement) {
        return AnnouncementResponse.builder()
            .id(announcement.getId())
            .title(announcement.getTitle())
            .body(announcement.getBody())
            .type(announcement.getType())
            .audience(announcement.getAudience())
            .audienceRef(announcement.getAudienceRef())
            .link(announcement.getLink())
            .createdBy(announcement.getCreatedBy())
            .publishedAt(announcement.getPublishedAt())
            .createdAt(announcement.getCreatedAt())
            .updatedAt(announcement.getUpdatedAt())
            .build();
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

}
