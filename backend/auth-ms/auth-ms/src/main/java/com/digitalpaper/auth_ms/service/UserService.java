package com.digitalpaper.auth_ms.service;

import com.digitalpaper.auth_ms.dto.request.AdminUserUpdateRequest;
import com.digitalpaper.auth_ms.dto.request.RegisterRequest;
import com.digitalpaper.auth_ms.dto.response.AdminUserResponse;
import com.digitalpaper.auth_ms.dto.response.PageResponse;
import com.digitalpaper.auth_ms.entity.User;
import com.digitalpaper.auth_ms.entity.enums.UserRole;


public interface UserService {

    void userRegistry(RegisterRequest registerRequest);
    void touchLastLogin(User user);
    PageResponse<AdminUserResponse> listUsers(String q, UserRole role, int page, int size);
    AdminUserResponse getUser(Long id);
    AdminUserResponse updateUser(Long id, AdminUserUpdateRequest request);

}
