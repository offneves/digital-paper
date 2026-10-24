package com.digitalpaper.auth.service.impl;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import com.digitalpaper.auth.entity.Profile;
import com.digitalpaper.auth.entity.User;
import com.digitalpaper.auth.entity.UserProfile;
import com.digitalpaper.auth.entity.enums.UserProfileStatus;
import com.digitalpaper.auth.entity.enums.UserRole;
import com.digitalpaper.auth.exception.BusinessException;
import com.digitalpaper.auth.exception.enums.ErrorCode;
import com.digitalpaper.auth.repository.ProfileRepository;
import com.digitalpaper.auth.repository.UserProfileRepository;
import com.digitalpaper.auth.service.ProfileService;
import com.digitalpaper.auth.service.UserProfileService;
import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class UserProfileServiceImpl implements UserProfileService {

    private final UserProfileRepository userProfileRepository;
    private final ProfileRepository profileRepository;
    private final ProfileService profileService;

    private static final String PROFILE_PUBLIC = "Público";
    private static final String PROFILE_ENTERPRISE = "Empresa";
    private static final String PROFILE_ADMIN = "Administrador";

    
    @Override
    public void assignDefaultProfile(User user) {
        String profileName = resolveDefaultProfile(user.getRole());
        if (profileName == null) {
            return;
        }
        createLinkIfAbsent(user, profileName, null);
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
            createLinkIfAbsent(user, nextProfile, null);
        }
    }

    @Override
    public void replaceProfiles(User user, List<Long> profileIds, User assigner) {
        List<Long> desiredIds = profileIds == null
            ? List.of()
            : profileIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        List<UserProfile> currentLinks = userProfileRepository.findByUserIdWithProfile(user.getId());
        Set<Long> currentIds = currentLinks.stream()
            .map(link -> link.getProfile().getId())
            .collect(Collectors.toSet());

        Map<Long, Profile> desiredProfiles = Map.of();
        if (!desiredIds.isEmpty()) {
            desiredProfiles = profileRepository.findAllById(desiredIds).stream()
                .collect(Collectors.toMap(Profile::getId, Function.identity()));

            if (desiredProfiles.size() != desiredIds.size()) {
                throw new BusinessException(ErrorCode.PROFILE_NOT_FOUND);
            }

            for (Profile profile : desiredProfiles.values()) {
                boolean alreadyLinked = currentIds.contains(profile.getId());
                if (!Boolean.TRUE.equals(profile.getActive()) && !alreadyLinked) {
                    throw new BusinessException(ErrorCode.PROFILE_INACTIVE);
                }
                if (!isProfileAssignableForRole(profile, user.getRole())) {
                    throw new BusinessException(ErrorCode.PROFILE_ROLE_MISMATCH);
                }
            }
        }

        Set<Long> desiredSet = new HashSet<>(desiredIds);

        for (UserProfile link : currentLinks) {
            Long profileId = link.getProfile().getId();
            if (!desiredSet.contains(profileId)) {
                userProfileRepository.delete(link);
            }
        }

        for (Long profileId : desiredIds) {
            if (currentIds.contains(profileId)) {
                continue;
            }
            Profile profile = desiredProfiles.get(profileId);
            UserProfile userProfile = UserProfile.builder()
                .user(user)
                .profile(profile)
                .assigner(assigner)
                .status(UserProfileStatus.ACTIVE)
                .assignedAt(LocalDateTime.now())
                .build();
            userProfileRepository.save(userProfile);
        }
    }

    @Override
    public List<UserProfile> listByUserId(Long userId) {
        return userProfileRepository.findByUserIdWithProfile(userId);
    }

    private void createLinkIfAbsent(User user, String profileName, User assigner) {
        Profile profile = profileService.getProfileByName(profileName);

        if (userProfileRepository.existsByUser_IdAndProfile_Id(user.getId(), profile.getId())) {
            return;
        }

        UserProfile userProfile = UserProfile.builder()
            .user(user)
            .profile(profile)
            .assigner(assigner)
            .status(UserProfileStatus.ACTIVE)
            .assignedAt(LocalDateTime.now())
            .build();

        userProfileRepository.save(userProfile);
    }

    private String resolveDefaultProfile(UserRole role) {
        return switch (role) {
            case COMMON_USER -> PROFILE_PUBLIC;
            case ENTERPRISE_USER -> PROFILE_ENTERPRISE;
            case ADMIN -> PROFILE_ADMIN;
            default -> null;
        };
    }

    private boolean isSystemProfile(String profileName) {
        return PROFILE_PUBLIC.equals(profileName)
            || PROFILE_ENTERPRISE.equals(profileName)
            || PROFILE_ADMIN.equals(profileName);
    }

    private boolean isProfileAssignableForRole(Profile profile, UserRole role) {
        String name = profile.getProfileName();
        if (isSystemProfile(name)) {
            String expected = resolveDefaultProfile(role);
            return expected != null && expected.equals(name);
        }
        // Perfis de secretaria / customizados: apenas servidor público
        return role == UserRole.PUBLIC_SERVANT;
    }

}
