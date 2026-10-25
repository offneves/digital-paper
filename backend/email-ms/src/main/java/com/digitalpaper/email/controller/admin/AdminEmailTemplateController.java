package com.digitalpaper.email.controller.admin;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.digitalpaper.email.dto.request.EmailTemplateEnabledRequest;
import com.digitalpaper.email.dto.request.EmailTemplatePreviewRequest;
import com.digitalpaper.email.dto.request.EmailTemplateRequest;
import com.digitalpaper.email.dto.request.EmailTemplateTestRequest;
import com.digitalpaper.email.dto.response.EmailResponse;
import com.digitalpaper.email.dto.response.EmailTemplatePreviewResponse;
import com.digitalpaper.email.dto.response.EmailTemplateResponse;
import com.digitalpaper.email.security.SecurityUtils;
import com.digitalpaper.email.service.EmailTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/admin/email/template")
@RequiredArgsConstructor
public class AdminEmailTemplateController {

    private final EmailTemplateService templateService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EmailTemplateResponse>> list() {
        return ResponseEntity.ok(templateService.list());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmailTemplateResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(templateService.get(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmailTemplateResponse> create(@RequestBody @Valid EmailTemplateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(templateService.create(request, SecurityUtils.currentUser().id()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmailTemplateResponse> update(
        @PathVariable Long id,
        @RequestBody @Valid EmailTemplateRequest request
    ) {
        return ResponseEntity.ok(templateService.update(id, request, SecurityUtils.currentUser().id()));
    }

    @PatchMapping("/{id}/enabled")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmailTemplateResponse> setEnabled(
        @PathVariable Long id,
        @RequestBody @Valid EmailTemplateEnabledRequest request
    ) {
        return ResponseEntity.ok(templateService.setEnabled(id, request.enabled(), SecurityUtils.currentUser().id()));
    }

    @PostMapping("/{id}/restore-default")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmailTemplateResponse> restoreDefault(@PathVariable Long id) {
        return ResponseEntity.ok(templateService.restoreDefault(id, SecurityUtils.currentUser().id()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        templateService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/preview")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmailTemplatePreviewResponse> preview(@RequestBody EmailTemplatePreviewRequest request) {
        return ResponseEntity.ok(templateService.preview(request));
    }

    @PostMapping("/{id}/test")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmailResponse> sendTest(
        @PathVariable Long id,
        @RequestBody @Valid EmailTemplateTestRequest request
    ) {
        return ResponseEntity.ok(templateService.sendTest(id, request));
    }

}
