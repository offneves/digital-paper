package com.digitalpaper.auth_ms.service;

import java.util.List;
import com.digitalpaper.auth_ms.dto.request.ProfileRequest;
import com.digitalpaper.auth_ms.dto.response.ProfileResponse;
import com.digitalpaper.auth_ms.entity.Profile;


public interface ProfileService {

    List<Profile> getAllProfiles();
    Profile getProfileByName(String profileName);
    ProfileResponse createProfile(ProfileRequest profileRequest);
    ProfileResponse updateProfile(Long id, ProfileRequest profileRequest);
    void deleteProfile(Long id);

}
