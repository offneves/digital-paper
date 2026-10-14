package com.digitalpaper.auth_ms.service.impl;

import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.sql.ast.tree.expression.Over;
import org.springframework.stereotype.Service;
import com.digitalpaper.auth_ms.dto.enums.ErrorCode;
import com.digitalpaper.auth_ms.entity.Profile;
import com.digitalpaper.auth_ms.entity.User;
import com.digitalpaper.auth_ms.entity.UserProfile;
import com.digitalpaper.auth_ms.entity.enums.UserProfileStatus;
import com.digitalpaper.auth_ms.entity.enums.UserRole;
import com.digitalpaper.auth_ms.exception.BusinessException;
import com.digitalpaper.auth_ms.repository.UserProfileRepository;
import com.digitalpaper.auth_ms.service.ProfileService;
import com.digitalpaper.auth_ms.service.UserProfileService;
import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class UserProfileServiceImpl implements UserProfileService {

    private final UserProfileRepository userProfileRepository;
    private final ProfileService profileService;

    private static final String PROFILE_PUBLIC = "Público";
    private static final String PROFILE_ENTERPRISE = "Empresa";


    @Override
    public void assignDefaultProfile(User user) {

        String profileName = resolveProfile(user.getRole());

        if (profileName == null) {
            return;
        }

        Profile profile = profileService.getProfileByName(profileName);

        if (userProfileRepository.existsByUser_IdAndProfile_Id(user.getId(), profile.getId())) {
            throw new BusinessException(ErrorCode.PROFILE_USER_EXISTS);
        }

        UserProfile userProfile = UserProfile.builder()
            .user(user)
            .profile(profile)
            .assigner(null)
            .status(UserProfileStatus.ACTIVE)
            .assignedAt(LocalDateTime.now())
            .build();

        userProfileRepository.save(userProfile);
    }

    private String resolveProfile(UserRole role) {
        return switch (role) {
            case COMMON_USER -> PROFILE_PUBLIC;
            case ENTERPRISE_USER -> PROFILE_ENTERPRISE;
            default -> null;
        };
    }

}
