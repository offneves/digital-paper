package com.digitalpaper.notification.service;

import com.digitalpaper.notification.dto.request.CreateAnnouncementRequest;
import com.digitalpaper.notification.dto.response.AnnouncementResponse;
import com.digitalpaper.notification.dto.response.PageResponse;


public interface AnnouncementService {

    AnnouncementResponse create(Long createdBy, CreateAnnouncementRequest request);
    PageResponse<AnnouncementResponse> list(int page, int size);
    AnnouncementResponse get(Long id);

}
