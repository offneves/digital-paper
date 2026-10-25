package com.digitalpaper.email;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.test.util.ReflectionTestUtils;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;
import com.digitalpaper.email.entity.EmailTemplate;
import com.digitalpaper.email.service.impl.EmailRenderer;
import com.digitalpaper.email.service.impl.EmailRenderer.RenderedEmail;
import com.digitalpaper.email.template.Placeholders;
import com.digitalpaper.email.template.SystemTemplates;
import com.digitalpaper.email.util.HtmlToText;


class EmailTemplatesTests {

    private static final String ACTION_URL = "http://localhost:5173/acao?token=abc123";
    private static final Map<String, String> VARIABLES = Map.of(
        "name", "Maria <Teste>",
        "login", "maria",
        "actionUrl", ACTION_URL,
        "expiresIn", "24 horas"
    );

    private EmailRenderer renderer;

    @BeforeEach
    void setUp() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setCharacterEncoding("UTF-8");

        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(resolver);

        renderer = new EmailRenderer(engine);
        ReflectionTestUtils.setField(renderer, "frontendBaseUrl", "http://localhost:5173/");
    }

    static Stream<EmailTemplate> systemTemplates() {
        return SystemTemplates.DEFAULTS.stream();
    }

    @ParameterizedTest
    @MethodSource("systemTemplates")
    void rendersSystemTemplates(EmailTemplate template) throws Exception {
        RenderedEmail rendered = renderer.render(template, VARIABLES);
        String html = rendered.html();
        String text = HtmlToText.convert(html);

        Path out = Path.of("target", "email-preview");
        Files.createDirectories(out);
        Files.writeString(out.resolve(template.getTemplateKey() + ".html"), html, StandardCharsets.UTF_8);
        Files.writeString(out.resolve(template.getTemplateKey() + ".txt"), text, StandardCharsets.UTF_8);

        assertEquals(template.getSubject(), rendered.subject());
        assertTrue(html.contains("href=\"" + ACTION_URL + "\" data-action"), "action button");
        assertTrue(html.contains("<strong>Maria &lt;Teste&gt;</strong>"), "name is escaped and bold");
        assertTrue(html.contains("<strong>24 horas</strong>"), "notice variable");
        assertFalse(html.matches("(?s).*\\sth:[a-z]+=.*"), "no unprocessed thymeleaf attributes");
        assertFalse(html.contains("{{"), "no unresolved placeholders");

        assertTrue(text.contains(ACTION_URL), "plain-text has the link");
        assertTrue(text.contains("Olá, Maria <Teste>."), "plain-text has the greeting");
    }

    @Test
    void adminContentIsNeverInterpretedAsMarkupOrTemplate() {
        EmailTemplate template = EmailTemplate.builder()
            .templateKey("custom")
            .subject("Olá {{name}}")
            .heading("<script>alert(1)</script>")
            .body("[[${T(java.lang.Runtime).getRuntime()}]]\n\n<img src=x onerror=alert(1)>")
            .buttonLabel("Abrir")
            .buttonUrl("javascript:alert(1)")
            .build();

        String html = renderer.render(template, Map.of("name", "Ana")).html();

        assertFalse(html.contains("<script>"), "heading escaped");
        assertFalse(html.contains("<img"), "body escaped");
        assertTrue(html.contains("[[${T(java.lang.Runtime).getRuntime()}]]"), "thymeleaf syntax kept as text");
        assertFalse(html.contains("javascript:"), "non-http button removed");
        assertFalse(html.contains("data-action"), "no button rendered");
    }

    @Test
    void placeholderHelpers() {
        assertEquals(Set.of("name", "actionUrl"), Placeholders.extract("Oi {{ name }}", null, "{{actionUrl}}"));
        assertEquals(List.of("Linha 1<br>linha 2", "<strong>B</strong>"), Placeholders.paragraphs("Linha 1\nlinha 2\n\n**B**", Map.of()));
        assertEquals("Oi", Placeholders.text("Oi {{missing}}", Map.of()));
    }

}
