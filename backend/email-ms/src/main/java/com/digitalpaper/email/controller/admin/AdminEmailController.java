package com.digitalpaper.email.controller.admin;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.digitalpaper.email.dto.response.EmailDetailResponse;
import com.digitalpaper.email.dto.response.EmailResponse;
import com.digitalpaper.email.dto.response.PageResponse;
import com.digitalpaper.email.entity.enums.EmailStatus;
import com.digitalpaper.email.service.EmailService;
import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/admin/email")
@RequiredArgsConstructor
public class AdminEmailController {

    private final EmailService emailService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PageResponse<EmailResponse>> list(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) EmailStatus status,
        @RequestParam(required = false) String template,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "25") int size
    ) {
        return ResponseEntity.ok(emailService.list(q, status, template, page, size));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmailDetailResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(emailService.get(id));
    }

    @PostMapping("/{id}/resend")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmailDetailResponse> resend(@PathVariable Long id) {
        return ResponseEntity.ok(emailService.resend(id));
    }

}
