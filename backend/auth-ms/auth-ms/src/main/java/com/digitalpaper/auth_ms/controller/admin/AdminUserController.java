package com.digitalpaper.auth_ms.controller.admin;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.digitalpaper.auth_ms.dto.request.AdminUserUpdateRequest;
import com.digitalpaper.auth_ms.dto.response.AdminUserResponse;
import com.digitalpaper.auth_ms.dto.response.PageResponse;
import com.digitalpaper.auth_ms.entity.enums.UserRole;
import com.digitalpaper.auth_ms.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/admin/user")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PageResponse<AdminUserResponse>> list(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) UserRole role,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "50") int size
    ) {
        return ResponseEntity.ok(userService.listUsers(q, role, page, size));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminUserResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUser(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminUserResponse> update(
        @PathVariable Long id,
        @RequestBody @Valid AdminUserUpdateRequest request
    ) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

}
