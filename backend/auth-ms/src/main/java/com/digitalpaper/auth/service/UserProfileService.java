package com.digitalpaper.auth.service;

import java.util.List;
import com.digitalpaper.auth.entity.User;
import com.digitalpaper.auth.entity.UserProfile;
import com.digitalpaper.auth.entity.enums.UserRole;


public interface UserProfileService {

    void assignDefaultProfile(User user);
    void syncDefaultProfileOnRoleChange(User user, UserRole previousRole, UserRole nextRole);
    List<UserProfile> listByUserId(Long userId);

}
