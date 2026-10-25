package com.digitalpaper.email.template;

import java.time.LocalDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import com.digitalpaper.email.repository.EmailTemplateRepository;
import lombok.RequiredArgsConstructor;


@Component
@RequiredArgsConstructor
public class SystemTemplateSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SystemTemplateSeeder.class);

    private final EmailTemplateRepository templateRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        SystemTemplates.DEFAULTS.stream()
            .filter(template -> !templateRepository.existsByTemplateKey(template.getTemplateKey()))
            .forEach(template -> {
                templateRepository.save(template.toBuilder()
                    .systemTemplate(true)
                    .enabled(true)
                    .createdAt(LocalDateTime.now())
                    .build());
                log.info("[EMAIL] [TEMPLATE] seeded system template '{}'", template.getTemplateKey());
            });
    }

}
