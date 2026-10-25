package com.digitalpaper.email.scheduler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import com.digitalpaper.email.service.EmailService;
import lombok.RequiredArgsConstructor;


@Component
@RequiredArgsConstructor
public class EmailRetryJob {

    private static final Logger log = LoggerFactory.getLogger(EmailRetryJob.class);

    private final EmailService emailService;

    @Scheduled(
        initialDelayString = "${app.mail.retry.poll-interval:30s}",
        fixedDelayString = "${app.mail.retry.poll-interval:30s}"
    )
    public void retryDue() {
        int processed = emailService.retryDue();
        if (processed > 0) {
            log.info("[EMAIL] [RETRY] processed {} pending e-mail(s)", processed);
        }
    }

}
