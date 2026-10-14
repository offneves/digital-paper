package com.digitalpaper.auth_ms.service.impl;

import java.util.List;
import org.springframework.stereotype.Service;
import com.digitalpaper.auth_ms.dto.enums.ErrorCode;
import com.digitalpaper.auth_ms.dto.request.ProfileRequest;
import com.digitalpaper.auth_ms.dto.response.ProfileResponse;
import com.digitalpaper.auth_ms.entity.Profile;
import com.digitalpaper.auth_ms.exception.BusinessException;
import com.digitalpaper.auth_ms.repository.ProfileRepository;
import com.digitalpaper.auth_ms.repository.UserProfileRepository;
import com.digitalpaper.auth_ms.service.ProfileService;
import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class ProfileServiceImpl implements ProfileService {

    private final ProfileRepository profileRepository;
    private final UserProfileRepository userProfileRepository;

    @Override
    public List<Profile> getAllProfiles() {
        return profileRepository.findAll();
    }

    @Override
    public Profile getProfileByName(String profileName) {
        return profileRepository.findByProfileName(profileName)
            .orElseThrow(() -> new BusinessException(ErrorCode.PROFILE_NOT_FOUND));

    }

    @Override
    public ProfileResponse createProfile(ProfileRequest profileRequest) {

        if (profileRepository.existsByProfileName(profileRequest.profileName())) {
            throw new BusinessException(ErrorCode.PROFILE_NAME_EXISTS);
        }

        Profile newProfile = Profile.builder()
            .profileName(profileRequest.profileName())
            .active(true)
            .build();

        Profile saved = profileRepository.save(newProfile);

        ProfileResponse profileResponse = ProfileResponse.builder()
            .id(saved.getId())
            .profileName(saved.getProfileName())
            .active(saved.getActive())
            .build();

        return profileResponse;
    }

    @Override
    public ProfileResponse updateProfile(Long id, ProfileRequest profileRequest) {
        Profile profile = profileRepository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.PROFILE_NOT_FOUND));

        String nextName = profileRequest.profileName().trim();
        if (!profile.getProfileName().equalsIgnoreCase(nextName)
            && Boolean.TRUE.equals(profileRepository.existsByProfileName(nextName))) {
            throw new BusinessException(ErrorCode.PROFILE_NAME_EXISTS);
        }

        profile.setProfileName(nextName);
        if (profileRequest.active() != null) {
            profile.setActive(profileRequest.active());
        }

        Profile updated = profileRepository.save(profile);

        return ProfileResponse.builder()
            .id(updated.getId())
            .profileName(updated.getProfileName())
            .active(updated.getActive())
            .build();
    }

    @Override
    public void deleteProfile(Long profileId) {
        Profile profile = profileRepository.findById(profileId)
            .orElseThrow(() -> new BusinessException(ErrorCode.PROFILE_NOT_FOUND));

        if (userProfileRepository.existsByProfile_Id(profileId)) {
            throw new BusinessException(ErrorCode.PROFILE_HAS_LINKED_USERS);
        }

        profileRepository.delete(profile);
    }
}
