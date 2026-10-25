package com.digitalpaper.email.service.impl;

import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import com.digitalpaper.email.config.EmailProperties;
import com.digitalpaper.email.exception.EmailDeliveryException;
import com.digitalpaper.email.service.EmailSender;
import com.digitalpaper.email.util.HtmlToText;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.mail.dry-run", havingValue = "false", matchIfMissing = true)
public class SmtpEmailSender implements EmailSender {

    private final JavaMailSender mailSender;
    private final EmailProperties properties;

    @Value("${spring.mail.username:}")
    private String smtpUsername;

    @Override
    public void send(String toEmail, String toName, String subject, String html) {
        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, true, StandardCharsets.UTF_8.name());

            helper.setFrom(new InternetAddress(resolveFrom(), properties.fromName(), StandardCharsets.UTF_8.name()));
            helper.setTo(toName == null || toName.isBlank()
                ? new InternetAddress(toEmail)
                : new InternetAddress(toEmail, toName, StandardCharsets.UTF_8.name()));
            helper.setSubject(subject);
            helper.setText(HtmlToText.convert(html), html);

            mailSender.send(mime);
        } catch (MailException | MessagingException | UnsupportedEncodingException e) {
            throw new EmailDeliveryException(rootMessage(e), e);
        }
    }

    private String resolveFrom() {
        if (properties.from() != null && !properties.from().isBlank()) {
            return properties.from().trim();
        }
        return smtpUsername;
    }

    private static String rootMessage(Throwable e) {
        Throwable root = e;
        while (root.getCause() != null && root.getCause() != root) {
            root = root.getCause();
        }
        String message = root.getMessage();
        return root.getClass().getSimpleName() + (message == null ? "" : ": " + message);
    }

}
