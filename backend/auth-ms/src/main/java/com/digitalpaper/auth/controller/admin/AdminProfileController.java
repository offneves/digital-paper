package com.digitalpaper.auth.controller.admin;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.digitalpaper.auth.dto.request.ProfileRequest;
import com.digitalpaper.auth.dto.response.ProfileResponse;
import com.digitalpaper.auth.entity.Profile;
import com.digitalpaper.auth.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/admin/profile")
@RequiredArgsConstructor
public class AdminProfileController {

    private final ProfileService profileService;


    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Profile>> getAll() {
        return ResponseEntity.ok(profileService.getAllProfiles());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProfileResponse> create(@RequestBody @Valid ProfileRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(profileService.createProfile(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProfileResponse> update(@PathVariable Long id,@RequestBody @Valid ProfileRequest request) {
        return ResponseEntity.ok(profileService.updateProfile(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        profileService.deleteProfile(id);
        return ResponseEntity.noContent().build();
    }
}
