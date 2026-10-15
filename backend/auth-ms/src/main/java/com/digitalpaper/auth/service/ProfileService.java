package com.digitalpaper.auth.service;

import java.util.List;
import com.digitalpaper.auth.dto.request.ProfileRequest;
import com.digitalpaper.auth.dto.response.ProfileResponse;
import com.digitalpaper.auth.entity.Profile;


public interface ProfileService {

    List<Profile> getAllProfiles();
    Profile getProfileByName(String profileName);
    ProfileResponse createProfile(ProfileRequest profileRequest);
    ProfileResponse updateProfile(Long id, ProfileRequest profileRequest);
    void deleteProfile(Long id);

}
