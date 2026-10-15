package com.digitalpaper.auth_ms.service;

import java.util.List;
import com.digitalpaper.auth_ms.entity.User;
import com.digitalpaper.auth_ms.entity.UserProfile;
import com.digitalpaper.auth_ms.entity.enums.UserRole;


public interface UserProfileService {

    void assignDefaultProfile(User user);
    void syncDefaultProfileOnRoleChange(User user, UserRole previousRole, UserRole nextRole);
    List<UserProfile> listByUserId(Long userId);

}
