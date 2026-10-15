package com.digitalpaper.auth.service;

import com.digitalpaper.auth.dto.request.AdminUserUpdateRequest;
import com.digitalpaper.auth.dto.request.RegisterRequest;
import com.digitalpaper.auth.dto.response.AdminUserResponse;
import com.digitalpaper.auth.dto.response.PageResponse;
import com.digitalpaper.auth.entity.User;
import com.digitalpaper.auth.entity.enums.UserRole;


public interface UserService {

    void userRegistry(RegisterRequest registerRequest);
    void touchLastLogin(User user);
    PageResponse<AdminUserResponse> listUsers(String q, UserRole role, int page, int size);
    AdminUserResponse getUser(Long id);
    AdminUserResponse updateUser(Long id, AdminUserUpdateRequest request);

}
