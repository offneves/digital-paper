package com.digitalpaper.email.service.impl;

import java.time.Year;
import java.util.Locale;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.thymeleaf.ITemplateEngine;
import org.thymeleaf.context.Context;
import com.digitalpaper.email.entity.EmailTemplate;
import com.digitalpaper.email.template.Placeholders;
import lombok.RequiredArgsConstructor;


@Component
@RequiredArgsConstructor
public class EmailRenderer {

    private static final Logger log = LoggerFactory.getLogger(EmailRenderer.class);
    private static final Locale PT_BR = Locale.forLanguageTag("pt-BR");
    private static final String LAYOUT = "email/standard";

    private final ITemplateEngine templateEngine;

    @Value("${app.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    public record RenderedEmail(String subject, String html) {}

    public RenderedEmail render(EmailTemplate template, Map<String, String> variables) {
        String subject = Placeholders.text(template.getSubject(), variables);
        String buttonUrl = safeUrl(Placeholders.text(template.getButtonUrl(), variables), template);

        Context context = new Context(PT_BR);
        context.setVariable("subject", subject);
        context.setVariable("preheader", Placeholders.text(template.getPreheader(), variables));
        context.setVariable("eyebrow", Placeholders.text(template.getEyebrow(), variables));
        context.setVariable("heading", Placeholders.text(template.getHeading(), variables));
        context.setVariable("paragraphs", Placeholders.paragraphs(template.getBody(), variables));
        context.setVariable("buttonLabel", Placeholders.text(template.getButtonLabel(), variables));
        context.setVariable("buttonUrl", buttonUrl);
        context.setVariable("notice", Placeholders.html(template.getNotice(), variables));
        context.setVariable("footerNote", Placeholders.html(template.getFooterNote(), variables));
        context.setVariable("appUrl", appUrl());
        context.setVariable("year", Year.now().getValue());

        return new RenderedEmail(subject, templateEngine.process(LAYOUT, context));
    }

    public String appUrl() {
        return frontendBaseUrl.replaceAll("/$", "");
    }

    private static String safeUrl(String url, EmailTemplate template) {
        if (url == null) {
            return null;
        }
        if (url.startsWith("https://") || url.startsWith("http://")) {
            return url;
        }
        log.warn("[EMAIL] [TEMPLATE] '{}' button URL ignored (not http/https): {}", template.getTemplateKey(), url);
        return null;
    }

}
