package com.digitalpaper.email.service.impl;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.digitalpaper.email.dto.request.EmailTemplatePreviewRequest;
import com.digitalpaper.email.dto.request.EmailTemplateRequest;
import com.digitalpaper.email.dto.request.EmailTemplateTestRequest;
import com.digitalpaper.email.dto.response.EmailResponse;
import com.digitalpaper.email.dto.response.EmailTemplatePreviewResponse;
import com.digitalpaper.email.dto.response.EmailTemplateResponse;
import com.digitalpaper.email.entity.EmailTemplate;
import com.digitalpaper.email.entity.enums.EmailStatus;
import com.digitalpaper.email.exception.BusinessException;
import com.digitalpaper.email.exception.enums.ErrorCode;
import com.digitalpaper.email.repository.EmailRepository;
import com.digitalpaper.email.repository.EmailTemplateRepository;
import com.digitalpaper.email.service.EmailService;
import com.digitalpaper.email.service.EmailTemplateService;
import com.digitalpaper.email.template.Placeholders;
import com.digitalpaper.email.template.SystemTemplates;
import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class EmailTemplateServiceImpl implements EmailTemplateService {

    private static final Pattern KEY_PATTERN = Pattern.compile("^[a-z0-9]+(?:-[a-z0-9]+)*$");
    private static final int STATS_WINDOW_DAYS = 30;

    private final EmailTemplateRepository templateRepository;
    private final EmailRepository emailRepository;
    private final EmailRenderer emailRenderer;
    private final EmailService emailService;

    private record Stats(long sentLast30Days, LocalDateTime lastSentAt) {}

    @Override
    @Transactional(readOnly = true)
    public List<EmailTemplateResponse> list() {
        Map<String, Stats> stats = loadStats();

        return templateRepository.findAll().stream()
            .sorted(Comparator
                .comparing((EmailTemplate t) -> !Boolean.TRUE.equals(t.getSystemTemplate()))
                .thenComparing(EmailTemplate::getName, String.CASE_INSENSITIVE_ORDER))
            .map(template -> toResponse(template, stats.get(template.getTemplateKey())))
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public EmailTemplateResponse get(Long id) {
        EmailTemplate template = findOrThrow(id);
        return toResponse(template, loadStats().get(template.getTemplateKey()));
    }

    @Override
    @Transactional
    public EmailTemplateResponse create(EmailTemplateRequest request, Long adminId) {
        String key = request.templateKey() == null ? "" : request.templateKey().trim();

        if (key.isEmpty() || !KEY_PATTERN.matcher(key).matches()) {
            throw new BusinessException(ErrorCode.TEMPLATE_KEY_INVALID);
        }
        if (templateRepository.existsByTemplateKey(key)) {
            throw new BusinessException(ErrorCode.TEMPLATE_KEY_EXISTS);
        }

        EmailTemplate template = EmailTemplate.builder()
            .templateKey(key)
            .systemTemplate(false)
            .enabled(true)
            .createdAt(LocalDateTime.now())
            .build();

        applyContent(template, request);
        template.setSensitive(Boolean.TRUE.equals(request.sensitive()));
        template.setButtonUrl(blankToNull(request.buttonUrl()));
        template.setUpdatedBy(adminId);
        validateButton(template);
        template.setVariables(String.join(",", extractVariables(template)));

        return toResponse(templateRepository.save(template), null);
    }

    @Override
    @Transactional
    public EmailTemplateResponse update(Long id, EmailTemplateRequest request, Long adminId) {
        EmailTemplate template = findOrThrow(id);
        boolean system = Boolean.TRUE.equals(template.getSystemTemplate());

        applyContent(template, request);

        if (!system) {
            template.setSensitive(Boolean.TRUE.equals(request.sensitive()));
            template.setButtonUrl(blankToNull(request.buttonUrl()));
        }

        validateButton(template);

        if (!system) {
            template.setVariables(String.join(",", extractVariables(template)));
        }

        template.setUpdatedAt(LocalDateTime.now());
        template.setUpdatedBy(adminId);

        EmailTemplate saved = templateRepository.save(template);
        return toResponse(saved, loadStats().get(saved.getTemplateKey()));
    }

    @Override
    @Transactional
    public EmailTemplateResponse setEnabled(Long id, boolean enabled, Long adminId) {
        EmailTemplate template = findOrThrow(id);
        template.setEnabled(enabled);
        template.setUpdatedAt(LocalDateTime.now());
        template.setUpdatedBy(adminId);

        EmailTemplate saved = templateRepository.save(template);
        return toResponse(saved, loadStats().get(saved.getTemplateKey()));
    }

    @Override
    @Transactional
    public EmailTemplateResponse restoreDefault(Long id, Long adminId) {
        EmailTemplate template = findOrThrow(id);

        EmailTemplate defaults = SystemTemplates.defaultFor(template.getTemplateKey())
            .filter(value -> Boolean.TRUE.equals(template.getSystemTemplate()))
            .orElseThrow(() -> new BusinessException(ErrorCode.TEMPLATE_NO_DEFAULT));

        template.setName(defaults.getName());
        template.setDescription(defaults.getDescription());
        template.setSensitive(defaults.getSensitive());
        template.setSubject(defaults.getSubject());
        template.setPreheader(defaults.getPreheader());
        template.setEyebrow(defaults.getEyebrow());
        template.setHeading(defaults.getHeading());
        template.setBody(defaults.getBody());
        template.setButtonLabel(defaults.getButtonLabel());
        template.setButtonUrl(defaults.getButtonUrl());
        template.setNotice(defaults.getNotice());
        template.setFooterNote(defaults.getFooterNote());
        template.setVariables(defaults.getVariables());
        template.setUpdatedAt(LocalDateTime.now());
        template.setUpdatedBy(adminId);

        EmailTemplate saved = templateRepository.save(template);
        return toResponse(saved, loadStats().get(saved.getTemplateKey()));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        EmailTemplate template = findOrThrow(id);
        if (Boolean.TRUE.equals(template.getSystemTemplate())) {
            throw new BusinessException(ErrorCode.TEMPLATE_SYSTEM_PROTECTED);
        }
        templateRepository.delete(template);
    }

    @Override
    @Transactional(readOnly = true)
    public EmailTemplatePreviewResponse preview(EmailTemplatePreviewRequest request) {
        EmailTemplate draft = new EmailTemplate();
        EmailTemplate saved = request.templateId() == null ? null : findOrThrow(request.templateId());

        if (request.template() != null) {
            applyContent(draft, request.template());
            draft.setTemplateKey(request.template().templateKey());
            draft.setButtonUrl(blankToNull(request.template().buttonUrl()));
        }

        Set<String> variables = new LinkedHashSet<>();
        if (saved != null && Boolean.TRUE.equals(saved.getSystemTemplate())) {
            draft.setTemplateKey(saved.getTemplateKey());
            draft.setButtonUrl(saved.getButtonUrl());
            variables.addAll(Placeholders.split(saved.getVariables()));
        }
        variables.addAll(extractVariables(draft));

        Map<String, String> values = new LinkedHashMap<>(sampleValues(variables));
        if (request.variables() != null) {
            request.variables().forEach((key, value) -> {
                if (value != null && !value.isBlank()) {
                    values.put(key, value);
                }
            });
        }

        if (draft.getHeading() == null) {
            draft.setHeading("Título do e-mail");
        }
        if (draft.getBody() == null) {
            draft.setBody("O conteúdo do e-mail aparece aqui.");
        }

        EmailRenderer.RenderedEmail rendered = emailRenderer.render(draft, values);
        return new EmailTemplatePreviewResponse(
            rendered.subject(),
            rendered.html(),
            List.copyOf(variables),
            values
        );
    }

    @Override
    public EmailResponse sendTest(Long id, EmailTemplateTestRequest request) {
        EmailTemplate template = findOrThrow(id);

        Set<String> variables = new LinkedHashSet<>(Placeholders.split(template.getVariables()));
        variables.addAll(extractVariables(template));

        Map<String, String> values = new HashMap<>(sampleValues(variables));
        if (request.variables() != null) {
            request.variables().forEach((key, value) -> {
                if (value != null && !value.isBlank()) {
                    values.put(key, value);
                }
            });
        }

        return emailService.sendTest(template, request.to().trim(), values);
    }

    private void applyContent(EmailTemplate template, EmailTemplateRequest request) {
        template.setName(trimToNull(request.name()));
        template.setDescription(blankToNull(request.description()));
        template.setSubject(trimToNull(request.subject()));
        template.setPreheader(blankToNull(request.preheader()));
        template.setEyebrow(blankToNull(request.eyebrow()));
        template.setHeading(trimToNull(request.heading()));
        template.setBody(request.body() == null || request.body().isBlank() ? null : request.body().strip());
        template.setButtonLabel(blankToNull(request.buttonLabel()));
        template.setNotice(blankToNull(request.notice()));
        template.setFooterNote(blankToNull(request.footerNote()));
    }

    private static void validateButton(EmailTemplate template) {
        String label = template.getButtonLabel();
        String url = template.getButtonUrl();

        if (label == null && url == null) {
            return;
        }
        boolean urlOk = url != null
            && (url.startsWith("https://") || url.startsWith("http://") || url.startsWith("{{"));

        if (label == null || !urlOk) {
            throw new BusinessException(ErrorCode.TEMPLATE_BUTTON_INVALID);
        }
    }

    private static Set<String> extractVariables(EmailTemplate template) {
        return Placeholders.extract(
            template.getSubject(),
            template.getPreheader(),
            template.getEyebrow(),
            template.getHeading(),
            template.getBody(),
            template.getButtonLabel(),
            template.getButtonUrl(),
            template.getNotice(),
            template.getFooterNote()
        );
    }

    private Map<String, String> sampleValues(Set<String> variables) {
        Map<String, String> values = new LinkedHashMap<>();
        for (String variable : variables) {
            values.put(variable, switch (variable) {
                case "name" -> "Maria Silva";
                case "login" -> "maria.silva";
                case "email" -> "maria.silva@exemplo.com";
                case "actionUrl" -> emailRenderer.appUrl() + "/exemplo?token=demo";
                case "expiresIn" -> "24 horas";
                default -> "[" + variable + "]";
            });
        }
        return values;
    }

    private Map<String, Stats> loadStats() {
        Map<String, Stats> stats = new HashMap<>();
        LocalDateTime since = LocalDateTime.now().minusDays(STATS_WINDOW_DAYS);

        for (Object[] row : emailRepository.sentStatsByTemplate(EmailStatus.SENT, since)) {
            long count = row[1] == null ? 0 : ((Number) row[1]).longValue();
            stats.put((String) row[0], new Stats(count, (LocalDateTime) row[2]));
        }
        return stats;
    }

    private EmailTemplate findOrThrow(Long id) {
        return templateRepository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.TEMPLATE_NOT_FOUND));
    }

    private static String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String blankToNull(String value) {
        return trimToNull(value);
    }

    private static EmailTemplateResponse toResponse(EmailTemplate template, Stats stats) {
        return EmailTemplateResponse.builder()
            .id(template.getId())
            .templateKey(template.getTemplateKey())
            .name(template.getName())
            .description(template.getDescription())
            .systemTemplate(Boolean.TRUE.equals(template.getSystemTemplate()))
            .enabled(Boolean.TRUE.equals(template.getEnabled()))
            .sensitive(Boolean.TRUE.equals(template.getSensitive()))
            .subject(template.getSubject())
            .preheader(template.getPreheader())
            .eyebrow(template.getEyebrow())
            .heading(template.getHeading())
            .body(template.getBody())
            .buttonLabel(template.getButtonLabel())
            .buttonUrl(template.getButtonUrl())
            .notice(template.getNotice())
            .footerNote(template.getFooterNote())
            .variables(Placeholders.split(template.getVariables()))
            .sentLast30Days(stats == null ? 0 : stats.sentLast30Days())
            .lastSentAt(stats == null ? null : stats.lastSentAt())
            .createdAt(template.getCreatedAt())
            .updatedAt(template.getUpdatedAt())
            .build();
    }

}
