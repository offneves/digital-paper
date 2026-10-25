package com.digitalpaper.email.service.impl;

import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import com.digitalpaper.email.service.EmailSender;


@Service
@ConditionalOnProperty(name = "app.mail.dry-run", havingValue = "true")
public class LoggingEmailSender implements EmailSender {

    private static final Logger log = LoggerFactory.getLogger(LoggingEmailSender.class);
    private static final Pattern ACTION_LINK = Pattern.compile("href=\"(https?://[^\"]+)\"[^>]*data-action");

    @Override
    public void send(String toEmail, String toName, String subject, String html) {
        Matcher matcher = ACTION_LINK.matcher(html);
        String actionUrl = matcher.find() ? matcher.group(1).replace("&amp;", "&") : "-";

        log.info(
            "[EMAIL] [DRY-RUN] to={} <{}> subject=\"{}\" action={}",
            toName,
            toEmail,
            subject,
            actionUrl
        );
    }

}
