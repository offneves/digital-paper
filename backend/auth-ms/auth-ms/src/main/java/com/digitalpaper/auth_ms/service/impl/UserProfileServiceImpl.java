package com.digitalpaper.auth_ms.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import com.digitalpaper.auth_ms.entity.Profile;
import com.digitalpaper.auth_ms.entity.User;
import com.digitalpaper.auth_ms.entity.UserProfile;
import com.digitalpaper.auth_ms.entity.enums.UserProfileStatus;
import com.digitalpaper.auth_ms.entity.enums.UserRole;
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
        String profileName = resolveDefaultProfile(user.getRole());
        if (profileName == null) {
            return;
        }
        createLinkIfAbsent(user, profileName);
    }

    @Override
    public void syncDefaultProfileOnRoleChange(User user, UserRole previousRole, UserRole nextRole) {
        if (previousRole == nextRole) {
            return;
        }

        String previousProfile = resolveDefaultProfile(previousRole);
        String nextProfile = resolveDefaultProfile(nextRole);

        if (previousProfile != null) {
            userProfileRepository
                .findByUser_IdAndProfile_ProfileName(user.getId(), previousProfile)
                .ifPresent(userProfileRepository::delete);
        }

        if (nextProfile != null) {
            createLinkIfAbsent(user, nextProfile);
        }
    }

    @Override
    public List<UserProfile> listByUserId(Long userId) {
        return userProfileRepository.findByUserIdWithProfile(userId);
    }

    private void createLinkIfAbsent(User user, String profileName) {
        Profile profile = profileService.getProfileByName(profileName);

        if (userProfileRepository.existsByUser_IdAndProfile_Id(user.getId(), profile.getId())) {
            return;
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

    private String resolveDefaultProfile(UserRole role) {
        return switch (role) {
            case COMMON_USER -> PROFILE_PUBLIC;
            case ENTERPRISE_USER -> PROFILE_ENTERPRISE;
            default -> null;
        };
    }

}
